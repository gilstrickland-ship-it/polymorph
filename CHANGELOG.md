# Changelog

All notable changes to Polymorph are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) once `1.0.0` ships.

Until then, every release is pre-1.0 and the contract may evolve additively. See
`specs/` for the per-cycle log and `.specify/memory/constitution.md` for the principles
the contract follows.

## Unreleased

Pre-1.0 work is tracked in `specs/`. This section lists the merged surface since the
last tagged release; see the spec id for the per-cycle PR / rationale / tests.

### Added

- Three-importer surface in `@polymorph/authoring` — Tokens Studio (single + multi-file),
  Figma Variables, Figma Text + Effect Styles. `specs/{018,019,021}-*`.
- `RemoteManifestLoader` governance — SRI integrity, Ed25519 detached signature,
  contract-version pin, fail-closed rollback, ETag-conditional refresh, typed audit
  hook. `specs/022-loader-signing-governance/`.
- Reduced-motion clamp tokens (`pm.motion.duration.reduced`, `pm.motion.easing.reduced`)
  + `applyReducedMotion` transform + CSS `@media (prefers-reduced-motion: reduce)`
  emitter. `specs/023-reduced-motion/`.
- `@polymorph/builder` — headless React primitives for theme editing (`useThemeEditor`,
  typed token fields, `LintPanel`, `ThemeEditorRoot`). `specs/024-interactive-builder/`.
- Protected-surface floors — stricter lint thresholds for regulator-mandated content
  (`disclosure` role: 7:1 contrast, ≥14px font, ≥1.5 line-height).
  `specs/025-protected-floors/`.
- Cross-adapter **runtime parity** — every adapter (Web CSS + Dart + Swift + Kotlin)
  asserted equivalent to a baseline from `resolveTheme`. `specs/026-runtime-parity/`.
- Project-local lint **policy packs** (`lintWithPolicies`, `lintAllModesWithPolicies`).
  `specs/027-policy-packs/`.
- Authoring CLI commands — `polymorph init` / `diff` / `migrate` + in-process helpers.
  `specs/028-cli-authoring/`.
- `examples/builder-playground` — end-to-end integration of the builder + the Web
  adapter's themed primitives. `specs/029-builder-playground/`.

### Changed

- `LintCode` union includes `POLICY_RULE_ERROR`; `LintWarning.measured` /
  `LintWarning.threshold` are optional. `specs/030-hardening-pass/`.
- `useThemeEditor.setComponentProperty` writes to `pm.<role>.<property>` (the
  resolver's read path), not `pm.components.<role>.<property>`. Component overrides
  authored via the builder hook now actually take effect.

### Removed

- N/A — the contract grows additively per the versioning policy.

## Release process

We use a flat-versioned approach: every publishable `@polymorph/*` package bumps together
on each release. The bump rule:

| Change | Bump |
|---|---|
| Bug fix, doc-only, internal refactor | **patch** |
| Additive contract change, new opt-in feature, new lint code | **minor** |
| Breaking change (removed export, changed required token shape, contract version bump) | **major** (post-1.0); annotated under `Breaking changes` here pre-1.0 |

Release steps:

1. Cold-state `nx run-many -t build typecheck test conformance` green.
2. Bump each publishable `@polymorph/*` package's version (15 packages today; see
   `docs/reference/packages.md`). Keep `golden-web` private.
3. Update this CHANGELOG: move `Unreleased` items into a new `## [x.y.z] – YYYY-MM-DD`
   section.
4. Commit with `chore(release): vX.Y.Z`.
5. Tag the release: `git tag -a vX.Y.Z -m "vX.Y.Z"` and push tag.
6. `pnpm -r publish --access public --no-git-checks` (top-level; skips the private
   `golden-web` package automatically because its `package.json` carries `"private":
   true`).
7. Cut a GitHub Release using the changelog entry as the body.
