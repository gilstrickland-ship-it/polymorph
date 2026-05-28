# Remote loader governance

`RemoteManifestLoader` is the loader that fetches theme bytes over HTTP, and the one where
supply-chain posture matters. Its governance surface lets a regulated org treat themes the
way they already treat any other piece of remotely-delivered config: verified, pinned,
auditable, and recoverable when verification fails.

Everything below is **opt-in**. Orgs whose CDN-level posture already covers integrity +
signing can use the loader without any of these options.

## The four checks

```ts
import {
  RemoteManifestLoader,
  type RemoteManifestEvent,
} from "@polymorph/loaders";
import { webcrypto } from "node:crypto";

// 1) Load the trusted public key(s) once. Multiple keys = rotation window.
const spki = await fetch("https://keys.example/2026-Q2.spki").then((r) => r.arrayBuffer());
const trustedKey = await webcrypto.subtle.importKey(
  "spki", spki, { name: "Ed25519" }, false, ["verify"],
);

const loader = new RemoteManifestLoader({
  url: "https://themes.bank.example/v1/aurora.tokens.json",

  // (1) Integrity: SRI-style hash. If mismatched → IntegrityVerificationError.
  integrity: "sha384-9DemUmAa7AzfBjV0YwRpZQfBdLW5Yp0eBzIaQ4yCqB2H1OQZQ7s9KxX0",

  // (2) Signature: Ed25519 detached. Loader fetches `${url}.sig` by default.
  signatureKeys: [trustedKey],
  // signatureUrl: "https://keys.example/aurora.sig",  // override if not next to the theme

  // (3) Version pin: exact contractVersion match.
  expectedContractVersion: "0.0.0",

  // (4) Rollback: on (1)-(3) failure, surface the last good theme + emit `rollback`.
  rollbackOnVerifyFailure: true,

  // (5) ETag-conditional refresh (free, always on when the server sets ETag).
  cacheTtlMs: 5 * 60_000,

  // (6) Audit hook — route into SIEM / structured log / OTEL.
  onEvent: (e: RemoteManifestEvent) => auditPipeline.publish(e),
});

const handle = await loader.load();
```

### Order of operations

On each refresh: **integrity → signature → schema validation → version pin**. The cheap
checks run first; the expensive (network) one only when the cheap ones pass.

| Check | What it catches | What it doesn't |
|---|---|---|
| Integrity (SRI) | Any byte-level change since the hash was pinned. | Attacker who controls the hash too. |
| Signature (Ed25519) | Anyone who isn't holding the signing key. | Compromised signing key. |
| Version pin | Accidental contract-version drift (e.g. CDN cutover during a migration). | Same-version semantic regressions. |
| Schema validation | Structurally invalid payloads (always on). | Valid-shaped but semantically wrong. |

The four compose — orgs that need defence-in-depth turn all of them on; orgs with a single
trusted CDN may only want integrity.

## Schema-invalid payloads aren't "verification failures"

If `validateTheme` rejects the payload, the loader throws `ThemeValidationError` **without
rollback**. Rationale: validation failures aren't an attacker substituting a valid-shaped
theme — they're a structural bug in the published artifact, and silently rolling back hides
the bug from the team that needs to fix it. `rollbackOnVerifyFailure` only applies to the
three explicit verification checks.

## Audit events

Every state transition emits a typed event. The loader fires; the host interprets:

| `event.kind` | When |
|---|---|
| `fetch-start` | About to issue a fetch (carries `conditional: true` for ETag refreshes). |
| `cache-hit` | Within-TTL re-load — no network. |
| `not-modified` | Server returned 304 to a conditional request. |
| `fetched` | Body received; carries `status`, `bytes`, `etag`, computed `hash`. |
| `verify-success` | One of integrity / signature / version passed. |
| `verify-failure` | One of integrity / signature / version failed; throws or rolls back. |
| `rollback` | Surfaced a prior good theme instead of throwing. |
| `error` | Fetch/parse error (non-verification). |

A hook that throws is swallowed — the audit pipeline being down must not break theme
loading.

## ETag-conditional refresh

Free when the server sets `ETag`. The loader sends `If-None-Match` on every refresh past
the first; a `304 Not Modified` reuses the cached theme without re-parsing / re-validating /
re-resolving. Pair with `cacheTtlMs: 0` for "always refresh, but cheaply".

## Rollback semantics

`rollbackOnVerifyFailure: true` returns the *exact same `LoadedTheme` reference* from the
last successful load. Downstream `resolve()` / `lint()` calls hit the same memoised
per-mode results. The `rollback` event fires before the theme is returned, so the audit
pipeline always sees the failure even when no exception bubbles to the caller.

If no prior good theme is cached (i.e. first-ever load fails verification), the loader
throws the underlying `IntegrityVerificationError` / `SignatureVerificationError` /
`ContractVersionMismatchError` — rollback exists to keep a running system running, not to
silently mask startup failures.

## Key rotation

`signatureKeys` is a list. During a rotation window, trust BOTH the old key and the new one:

```ts
signatureKeys: [oldKey, newKey],   // either signature accepts
```

When all artifacts in flight have been re-signed with `newKey`, drop `oldKey` on the next
deploy. The audit `verify-success` event carries `detail: "key #N"` so the team can confirm
which key is actually being used.

## What this doesn't ship

- **A signing CLI.** FIs sign in their own CI; signing-key custody isn't ours to own. Any
  Ed25519 signer that produces detached signatures over the exact response bytes will work
  (`openssl pkeyutl -sign`, `cosign sign-blob`, etc.).
- **Key transport.** How you get the SPKI bytes to the loader is your problem — TOFU,
  bundled at build time, fetched from a known-good URL, hardware-backed. The loader trusts
  the `CryptoKey` you hand it.
- **TLS / DNS.** The runtime's `fetch` handles transport security. The loader presumes
  HTTPS but won't refuse `http://` — that's a runtime configuration choice.

## See also

- [Loaders](/guide/loaders) — the `ThemeLoader` interface and the three implementations.
- [FI adoption guide](/guides/fi) — where loader posture sits in the rollout decision tree.
