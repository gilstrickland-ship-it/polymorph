# Contract Versioning & Stability Policy

The semantic vocabulary is versioned independently (semver). **Additions are the only safe
change** (Constitution Principle III). The rules are mechanized by `diffManifests()` in
[`../src/version.ts`](../src/version.ts) and asserted in `tests/versioning.test.ts`.

| Change | Bump | Why |
|---|---|---|
| Add an **optional** token or component role | **MINOR** | Existing themes/SDKs keep validating |
| Add a **required** token | **MAJOR** | Can invalidate existing themes |
| Tighten a token **optional → required** | **MAJOR** | Same as adding a required constraint |
| **Rename** or **remove** a token or role | **MAJOR** | Breaks themes/SDKs targeting the old id |

A theme valid under vX.Y MUST stay valid under any additive vX.(Y+1) (SC-004).

## Process

1. Edit `manifest/semantic-vocabulary.v0.json`.
2. Run `pnpm --filter @polymorph/spec generate` to regenerate types + schema.
3. CI computes the required bump by diffing against the previously published manifest; a human
   sets the new version. Breaking (MAJOR) changes require a migration note in this file.

## Migration notes

_None yet — v0 pre-release. Record each MAJOR change here with before/after ids and guidance._
