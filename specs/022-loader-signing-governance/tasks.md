---

description: "Task list for Spec V — RemoteManifestLoader signing & governance"
---

# Tasks: RemoteManifestLoader Signing & Governance

**Input**: Design documents from `specs/022-loader-signing-governance/`.

## Phase 1: Integrity (US1, P1)

- [x] T001 `packages/loaders/src/integrity.ts`: `parseIntegrity`, `computeIntegrity` (SubtleCrypto digest via `node:crypto`'s `webcrypto`), `verifyIntegrity` (constant-time compare). Defaults to `sha384` per SRI's own recommendation.
- [x] T002 `tests/integrity.test.ts`: 6 tests — alg round-trip, default-alg, round-trip-vs-tamper, wrong-alg, parser-garbage.

## Phase 2: Ed25519 signature verification (US1+US3, P1)

- [x] T003 `packages/loaders/src/signature.ts`: `verifyEd25519(data, sig, keys)` returns matched-key index or null; iterates ALL keys even on early match (rotation correctness). Type alias `Ed25519PublicKey = webcrypto.CryptoKey` to keep DOM types out of the package surface.

## Phase 3: RemoteManifestLoader governance (US1-5, P1/P2)

- [x] T004 `packages/loaders/src/remote-manifest.ts`: extend `RemoteManifestOptions` with `integrity`, `signatureKeys`, `signatureUrl`, `expectedContractVersion`, `rollbackOnVerifyFailure`, `onEvent`. All optional; v1 defaults preserved.
- [x] T005 `remote-manifest.ts`: typed `RemoteManifestEvent` union covering `fetch-start`, `cache-hit`, `not-modified`, `fetched`, `verify-success`, `verify-failure`, `rollback`, `error`. Emit synchronously; swallow hook exceptions.
- [x] T006 `remote-manifest.ts`: new error classes `IntegrityVerificationError`, `SignatureVerificationError`, `ContractVersionMismatchError`.
- [x] T007 `remote-manifest.ts`: verification order integrity → signature → schema validation → version pin. Signature side-channel fetch defaults to `${url}.sig`; base64 decoded.
- [x] T008 `remote-manifest.ts`: `handleVerifyFailure` returns rollback theme when `rollbackOnVerifyFailure: true` AND a prior good theme is cached; otherwise throws the typed error. Schema validation failures are NEVER rolled back.
- [x] T009 `remote-manifest.ts`: `FetchLike` widened with optional `init.headers` (for `If-None-Match`) and optional response `headers.get(name)` (for `ETag`). Existing test stubs still type-check.
- [x] T010 `remote-manifest.ts`: ETag handling — store ETag on success; send `If-None-Match` on subsequent fetches; treat 304 as cache reuse + `not-modified` event; no re-validation needed.

## Phase 4: Barrel exports

- [x] T011 `packages/loaders/src/index.ts`: re-export new types/values — `RemoteManifestEvent`, the three error classes, `computeIntegrity` / `verifyIntegrity` / `parseIntegrity` / `IntegrityAlg` / `ParsedIntegrity`, `verifyEd25519` / `Ed25519PublicKey`.

## Phase 5: Tests

- [x] T012 `tests/governance.test.ts` setup: `beforeAll` generates an Ed25519 keypair with Node's `generateKeyPairSync`, exports the public half as SPKI, imports via `webcrypto.subtle.importKey` so the loader sees a real `CryptoKey` exactly like a browser caller would.
- [x] T013 Integrity tests (3): accept-match, reject-tamper, emit-verify-failure-before-throwing.
- [x] T014 Signature tests (5): accept-trusted-key, accept-any-of-trusted-set (rotation), reject-untrusted, reject-missing-sig-blob, custom-signatureUrl.
- [x] T015 Version-pin tests (3): accept-match, reject-mismatch, schema-invalid-never-rolls-back.
- [x] T016 Rollback tests (2): roll-back-on-integrity-failure (same `LoadedTheme` reference; rollback event fires), throws-when-no-prior-good-theme.
- [x] T017 ETag tests (2): If-None-Match sent on second load, not-modified event fires on 304.
- [x] T018 Audit tests (3): happy-path event sequence, hook-that-throws-doesnt-break-load, cache-hit-event-on-within-TTL-reload.

## Phase 6: Docs

- [x] T019 `docs/guide/loader-governance.md`: new page — full surface walkthrough, ordering table, audit-event catalogue, key-rotation playbook, what-isn't-shipped.
- [x] T020 `docs/guide/loaders.md`: pointer to the new governance page; updated v1 stub example to the new `cacheTtlMs` + `handle.resolve(mode)` API.
- [x] T021 `docs/.vitepress/config.ts`: add the page to the Guide sidebar.

## Phase 7: Verification

- [x] T022 `pnpm --filter @polymorph/loaders test` — 29 tests green (was 5; +24 new).
- [x] T023 `pnpm --filter @polymorph/docs run build` — site rebuilds with the new page; no broken-link warnings.
- [x] T024 Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **20 projects** (no new package added — governance ships inside `@polymorph/loaders`).

## Notes

- WebCrypto from `node:crypto`'s `webcrypto`, not DOM. Keeps DOM types out of the package
  surface (the loader is shared between Node and browser callers) and works in every
  runtime we target.
- `CryptoKey` (DOM) and `webcrypto.CryptoKey` (Node) are structurally identical; browser
  callers pass DOM `CryptoKey` and TS accepts it via structural typing.
- Schema validation failures are deliberately NOT rolled back. They're structural bugs in
  the artifact, not supply-chain attacks; silently rolling back hides them.
- We don't ship a signing CLI. FIs sign in their own CI with whatever they already trust
  (`openssl pkeyutl -sign`, `cosign sign-blob`, hardware-backed). Signing-key custody
  isn't ours to own.
- Signature blob is base64 in the wire format. Raw bytes work in theory but are ambiguous
  in `text/plain` responses; base64 is the dominant pattern.
- Key rotation is "trust multiple keys at once", not "rotate atomically". The audit
  `verify-success` event carries `detail: "key #N"` so the team can confirm which key is
  in use.
