# Tutorial 06 — Ship a theme via a CDN with signing

**Time**: ~20 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate), a CDN you control, a CI pipeline that can sign artifacts.

`RemoteManifestLoader` fetches a theme over HTTP at runtime — Polymorph's production-grade
delivery loader. This tutorial wires the full security posture: SRI integrity + Ed25519
signature + version pin + fail-closed rollback + audit hook.

---

## Step 1 — publish the theme + signature

Your CI builds `theme.tokens.json`. Add two more steps:

**(a) Compute the SHA-384** (matches Subresource Integrity):

```bash
openssl dgst -sha384 -binary theme.tokens.json | base64 > theme.tokens.json.sha384
# Result: ABCDe...= → wrap as "sha384-ABCDe...="
```

**(b) Sign with Ed25519**:

```bash
openssl pkeyutl -sign -inkey signing-key.pem -rawin -in theme.tokens.json \
  | base64 > theme.tokens.json.sig
```

Upload all three (`theme.tokens.json`, `theme.tokens.json.sig`, plus the SRI hash baked
into your app config) to your CDN.

## Step 2 — the host app's loader configuration

```ts
import { RemoteManifestLoader } from "@polymorph/loaders";
import { webcrypto } from "node:crypto"; // or browser's globalThis.crypto

// One-time at startup: import the public key (from your CI's signing keypair).
const spkiBytes = await fetch("/keys/2026-Q2.spki").then((r) => r.arrayBuffer());
const trustedKey = await webcrypto.subtle.importKey(
  "spki", spkiBytes, { name: "Ed25519" }, false, ["verify"],
);

const loader = new RemoteManifestLoader({
  url: "https://cdn.mybank.com/themes/v1/light.tokens.json",

  // (1) SRI — content addressing. If the bytes don't match, reject.
  integrity: "sha384-9DemUmAa7AzfBjV0YwRpZQfBdLW5Yp0eBzIaQ4yCqB2H1OQZQ7s9KxX0",

  // (2) Signature — author authenticity. Loader fetches `${url}.sig` by default.
  signatureKeys: [trustedKey],

  // (3) Version pin — contract drift. Rejects a contractVersion mismatch.
  expectedContractVersion: "0.0.0",

  // (4) Fail-closed rollback. On any verify failure, surface the last-known-good theme
  //     and emit `rollback` to the audit hook. Keeps your app running while you fix
  //     the deploy.
  rollbackOnVerifyFailure: true,

  // (5) ETag-conditional refresh — cheap "is this still current?" check.
  cacheTtlMs: 5 * 60_000,

  // (6) Audit hook — route into SIEM / OTEL / logs.
  onEvent: (e) => auditPipeline.publish(e),
});

// Now use it
const handle = await loader.load();
const theme = handle.resolve("light");
```

## Step 3 — handling the audit events

Every meaningful state transition emits a typed event:

| Event kind | When |
|---|---|
| `fetch-start` | About to fetch (carries `conditional: true` for ETag refreshes) |
| `cache-hit` | Within-TTL re-load — no network |
| `not-modified` | Server returned 304 |
| `fetched` | Body received; carries `status`, `bytes`, `etag`, computed `hash` |
| `verify-success` | One of integrity / signature / version passed |
| `verify-failure` | One of integrity / signature / version failed |
| `rollback` | Surfaced a prior good theme instead of throwing |
| `error` | Fetch/parse error (non-verification) |

Throwing from inside your hook is swallowed — the audit pipeline being down must never
break the theme load.

## Step 4 — key rotation

When you rotate the signing key, trust **both** during the cutover:

```ts
signatureKeys: [oldKey, newKey], // either signature accepts
```

When every artifact in flight has been re-signed with `newKey`, drop `oldKey` on the next
deploy. The audit `verify-success` event carries `detail: "key #N"` so you can confirm
which key validated.

## What happens when verification fails

| `rollbackOnVerifyFailure` | Behaviour |
|---|---|
| `false` (default) | Throws `IntegrityVerificationError` / `SignatureVerificationError` / `ContractVersionMismatchError`. App sees the error. |
| `true` | Surfaces the **last-known-good** theme. Emits a `rollback` event with `fromHash` + `toHash`. App keeps running while you investigate. |

**Schema-invalid payloads always throw**, regardless of `rollbackOnVerifyFailure` —
they're structural bugs in the artifact, not supply-chain attacks. Silently rolling back
would hide them from the team that needs to fix.

## Real-world validation

Run the loader against a real Primer-derived theme blob to verify the surface works:

```ts
// tests/integration-primer/tests/03-loader-governance.test.ts (excerpt)
const theme = buildPolymorphThemeFromPrimer(["light", "dark"]);
const bytes = new TextEncoder().encode(JSON.stringify(theme));
const integrity = await computeIntegrity(bytes, "sha384");

const loader = new RemoteManifestLoader({
  url: "https://cdn.example/github.theme.json",
  fetch: stubFetch({ [url]: { status: 200, body: JSON.stringify(theme) } }),
  integrity,
});

await expect(loader.load()).resolves.toBeDefined();
```

See [Report R4 — Loader governance](Report-04-Loader-Governance) for the full transcript.

## What's next

- [Tutorial 12 — Conformance & parity](Tutorial-12-Conformance-And-Parity) to gate CI on adapter agreement
- [SECURITY.md](https://github.com/gilstrickland-ship-it/polymorph/blob/main/SECURITY.md) for the disclosure process
