# Feature Specification: Remote-Manifest Signing & Governance

**Spec ID**: 022-loader-signing-governance

**Created**: 2026-05-28

**Status**: Implemented

**Input**: `RemoteManifestLoader` was minimal at v1 — fetch, parse, validate, in-memory
cache. Every production rollout asked the same follow-on: "How do we know the theme bytes
weren't tampered with?", "How do we pin a contract version through a CDN cutover?", "How do
we keep the app running when the CDN serves something we won't accept?". This spec adds the
governance layer those questions actually want.

---

## Overview

`RemoteManifestLoader` gains four optional checks (composable, opt-in), one transport
optimisation, and one audit surface:

1. **Integrity** — SRI-style hash (`sha256-…` / `sha384-…` / `sha512-…`).
2. **Signature** — Ed25519 detached, public key(s) supplied by caller.
3. **Version pin** — exact `contractVersion` match.
4. **Rollback** — on (1)/(2)/(3) failure, surface the last-known-good theme instead of
   throwing.
5. **ETag conditional refresh** — `If-None-Match` on every refresh past the first; 304
   reuses the cached handle without re-validation.
6. **Audit hook** — a typed event stream covering every state transition.

Everything stays in `@polymorph/loaders`; no new package. Existing callers don't need to
change anything — every new option is undefined-defaulted.

---

## Clarifications

### Session 2026-05-28

- Q: Raw key bytes or `CryptoKey` objects? → A: **`CryptoKey`.** Importing raw bytes
  requires algorithm-specific flags that differ between Node / browser / worker; pushing
  that out keeps the loader runtime-agnostic and lets the caller cache imports.
- Q: One key or many? → A: **`signatureKeys: CryptoKey[]`.** Rotation needs an overlap
  window where both keys validate.
- Q: Where does the signature blob live? → A: **`${url}.sig` by default, overridable.**
  Sibling-file convention; orgs serving from object stores often want a separate key URL.
- Q: Rollback on schema-invalid payloads? → A: **No.** Validation failure is a structural
  bug — silently rolling back hides it from the team that needs to fix it. Rollback is for
  the three explicit verification checks only.
- Q: Verification order? → A: **integrity → signature → schema validation → version pin.**
  Cheap-first; network-side-channel (signature blob) only when cheap passes; version pin
  reads `contractVersion`, which is only trustworthy post-validation.
- Q: Audit hook errors? → A: **Swallowed.** The audit pipeline being down must not break
  theme loading.
- Q: SRI default alg? → A: **sha384.** Matches SubresourceIntegrity's own recommendation
  and what every CDN already produces.
- Q: WebCrypto vs Node crypto? → A: **WebCrypto (`node:crypto`'s `webcrypto`).**
  Universal across Node / browser / worker / Bun / Deno.
- Q: Ship a signing CLI? → A: **No.** FIs sign in their own CI (`openssl pkeyutl -sign`,
  `cosign sign-blob`, hardware-backed signers, etc.). Signing-key custody isn't ours to own.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — An FI pins a signed theme to a contract version (Priority: P1)

The FI signs `aurora.tokens.json` in CI, publishes the bytes + a `.sig` blob to a CDN, and
configures the loader with the SRI hash, the public key, and the expected contract version.
On every refresh, all three checks pass before the theme is exposed to the SDK.

**Independent Test**: `governance.test.ts` — happy path with all three checks on; asserts
`verify-success` events in order (`integrity`, `signature`, `version`).

### User Story 2 — A bad deploy doesn't take down a running app (Priority: P1)

The FI accidentally publishes a payload that doesn't match the pinned hash. With
`rollbackOnVerifyFailure: true`, the loader emits `rollback` and continues serving the
last-known-good theme. The audit pipeline picks up the failure; the SRE rolls back the
deploy.

**Independent Test**: `governance.test.ts` — `rollback` test serves a tampered body on the
second load; asserts the same `LoadedTheme` reference is returned and a `rollback` event
fires.

### User Story 3 — Key rotation without downtime (Priority: P2)

The FI rotates signing keys. Trusted set carries `[oldKey, newKey]` during the cutover
window; either key validates. Once all artifacts in flight are re-signed, the old key drops
on the next deploy.

**Independent Test**: `governance.test.ts` — `signatureKeys: [wrongKey, rightKey]` accepts
a payload signed by `rightKey`.

### User Story 4 — Cheap refresh via ETag (Priority: P2)

The FI sets `cacheTtlMs: 0` so the loader always refetches, but the server's `ETag` carries
the load. After the first 200, every refresh is a 304 and reuses the cached handle without
re-validating.

**Independent Test**: `governance.test.ts` — ETag tests assert `If-None-Match` is sent on
the second load and that `not-modified` events fire on 304s.

### User Story 5 — Audit (Priority: P1)

The org's SIEM ingests every `RemoteManifestEvent`. An audit hook that throws never breaks
the load.

**Independent Test**: `governance.test.ts` — happy-path events test, plus a hook-that-throws
test.

### Edge Cases

- **Schema-invalid payload, rollback on**: throws `ThemeValidationError` — rollback does
  NOT apply to structural bugs.
- **First-ever load fails verification**: throws the verification error — rollback exists to
  keep a running system running, not to mask startup failures.
- **Missing `.sig` blob with `signatureKeys` set**: rejects with
  `SignatureVerificationError`.
- **`integrity` set to a string for the wrong algorithm**: returns `false` (length mismatch
  before constant-time compare).
- **Custom `signatureUrl`**: loader fetches from the override; tested.

---

## Requirements *(mandatory)*

- **FR-001**: `RemoteManifestLoader` MUST accept new optional options without breaking
  existing callers: `integrity`, `signatureKeys`, `signatureUrl`,
  `expectedContractVersion`, `rollbackOnVerifyFailure`, `onEvent`. Defaults preserve the
  v1 behaviour exactly.
- **FR-002**: Verification order MUST be integrity → signature → schema validation →
  version pin. Each runs only when the prior passes.
- **FR-003**: SRI strings MUST follow the format `(sha256|sha384|sha512)-<base64-digest>`.
  Comparison MUST be constant-time.
- **FR-004**: Signature verification MUST accept multiple trusted keys; verification MUST
  iterate all of them even on early match (bounded by the caller's key set, typically ≤3).
- **FR-005**: `rollbackOnVerifyFailure` MUST return the exact same `LoadedTheme` reference
  from the last successful load when triggered, and MUST emit a `rollback` event with the
  bad payload's hash and the good payload's hash.
- **FR-006**: Schema validation failures MUST throw `ThemeValidationError` regardless of
  `rollbackOnVerifyFailure`.
- **FR-007**: ETag-conditional refresh MUST send `If-None-Match` when an ETag from a prior
  fetch is cached; a 304 MUST reuse the cached handle without re-parsing / re-validating /
  re-resolving and MUST emit `not-modified`.
- **FR-008**: `onEvent` MUST be invoked synchronously on every state transition. A hook
  that throws MUST NOT propagate.
- **FR-009**: WebCrypto MUST come from `node:crypto`'s `webcrypto` (universal across Node /
  browser / worker). No DOM types in the package's type signatures.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/integrity.test.ts` — 6 tests (compute + parse + verify + round-trip +
  tamper + wrong-alg + garbage-input).
- **SC-002**: `tests/governance.test.ts` — 18 tests (3 integrity, 5 signature, 3 version
  pin, 2 rollback, 2 ETag, 3 audit).
- **SC-003**: `tooling/loaders` total **29 tests** (was 5; +24 new).
- **SC-004**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across **20 projects** (no new package).
- **SC-005**: New docs page `/guide/loader-governance` shipped; `/guide/loaders` updated
  with a pointer; sidebar entry added.

---

## Assumptions

- WebCrypto is universally available in the runtimes we target (Node 18+, modern browsers,
  Bun, Deno, workers). No polyfill ships with this package.
- Signing-key custody lives with the FI. We provide the verifier; the signer is theirs
  (`openssl`, `cosign`, hardware-backed). The spec deliberately doesn't standardise the
  signer.
- `CryptoKey` (web type) and `webcrypto.CryptoKey` (Node type) are structurally identical;
  TS accepts either at the call site.
- ETag refresh is best-effort — origins that don't send ETag headers degrade to the v1
  re-fetch-on-TTL-expiry behaviour. No warning logged; ETag isn't required.
- The audit hook is invoked on the main loader execution path. Heavy work in the hook
  blocks the load — orgs that need async pipelines should enqueue from the hook and process
  off-thread.
