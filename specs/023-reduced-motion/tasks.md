---

description: "Task list for Spec W — reduced-motion contract extension"
---

# Tasks: Reduced-Motion Contract Extension

**Input**: Design documents from `specs/023-reduced-motion/`.

## Phase 1: Contract (FR-001)

- [x] T001 `packages/spec/manifest/semantic-vocabulary.v0.json`: add `pm.motion.duration.reduced` (required, duration, invariant) and `pm.motion.easing.reduced` (optional, cubicBezier, invariant).
- [x] T002 Regenerate `packages/spec/src/generated/*` via `pnpm --filter @polymorph/spec run generate` (contract-ids + schemas) and `pnpm --filter @polymorph/spec exec tsx scripts/gen-fixtures.ts` (3 valid + 6 invalid fixtures).

## Phase 2: Runtime transform (FR-002 / FR-003)

- [x] T003 `packages/core/src/reduced-motion.ts`: `applyReducedMotion(resolved)` — pure, idempotent, non-mutating. Returns input unchanged when `pm.motion.duration.reduced` is missing. Walks tokens (by id prefix) and components (by structural shape match: `{value, unit: "ms"}` for duration; `[n, n, n, n]` for cubicBezier).
- [x] T004 `packages/core/src/index.ts`: export `applyReducedMotion`.

## Phase 3: Advisory lint (FR-006)

- [x] T005 `packages/core/src/errors.ts`: new `LintCode` member `MOTION_REDUCED_EXCEEDS_SHORT`.
- [x] T006 `packages/core/src/lint.ts`: new `lintReducedMotionClamp` rule — warns when `pm.motion.duration.reduced` > `pm.motion.duration.short`. Wired into `lintTheme`.

## Phase 4: Web adapter (FR-004 / FR-005)

- [x] T007 `packages/adapter-web/src/css-vars.ts`: `toReducedMotionMediaBlock(resolved, selector?)` — diffs `toCssVariables(resolved)` vs. `toCssVariables(applyReducedMotion(resolved))` and emits only the changed variables inside an `@media (prefers-reduced-motion: reduce)` block.
- [x] T008 `toCssVariablesString` signature: add optional third arg `{ reducedMotion?: "media" | "off" }`. Default `"media"` — emits the sibling block; `"off"` suppresses it.

## Phase 5: Fixture + golden migration (FR-007)

- [x] T009 Add `pm.motion.duration.reduced` (and demo `easing.reduced`) to both bank examples (`examples/mock-bank-aurora/theme/aurora.tokens.json`, `examples/mock-bank-borealis/theme/borealis.tokens.json`).
- [x] T010 Add `pm.motion.duration.reduced` to the three hand-authored core fixtures (`low-contrast`, `alias-cycle`, `dangling-alias`) so they still validate.
- [x] T011 Add the new token to the Tokens Studio import fixture (`tooling/authoring/tests/fixtures/tokens-studio.export.json`) and mapping (`mapping.json`).
- [x] T012 Update `tooling/authoring/tests/import.test.ts` counts: invariant 38 (was 37), unique ids 69 (was 68).
- [x] T013 Regenerate native goldens for Dart / Swift / Kotlin (4 banks × 2 modes × 3 adapters = 12 files). Verified via `nx run-many -t test`.

## Phase 6: Tests

- [x] T014 `packages/core/tests/reduced-motion.test.ts` — 8 tests: clamp-durations, clamp-easings, leaves-non-motion-unchanged, idempotence, non-mutation, linear-easing-default, returns-input-when-reduced-absent, lint-no-warn / lint-warn.
- [x] T015 `packages/adapter-web/tests/reduced-motion.test.ts` — 5 tests: media-block-shape (only motion vars), selector-override, `reducedMotion: "off"` opt-out, clamped-values-in-block, default-emits-media.

## Phase 7: Docs

- [x] T016 `docs/guide/reduced-motion.md`: new page — token table, runtime transform usage, Web CSS @media block, native runtime pattern, lint rule explanation, what-isn't-shipped.
- [x] T017 `docs/guide/advisory-lint.md`: add `MOTION_REDUCED_EXCEEDS_SHORT` row to the perceptual/motion table; remove the prior "Motion-reduce media query coverage" limitation note.
- [x] T018 `docs/.vitepress/config.ts`: add reduced-motion page to the Guide sidebar.

## Phase 8: Verification

- [x] T019 `pnpm --filter @polymorph/core test` — 43 tests green (was 35; +8 new).
- [x] T020 `pnpm --filter @polymorph/adapter-web test` — 27 tests green (was 22; +5 new).
- [x] T021 `pnpm --filter @polymorph/docs run build` — site rebuilds with the new page; no broken-link warnings.
- [x] T022 Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **20 projects** (no new package added).

## Notes

- One clamp, not per-token reduced companions. OS-level reduced-motion is binary;
  per-component tuning belongs in product code, not the design system.
- Required duration + optional linear-default easing keeps the migration footprint small
  while making the lint rule reliable.
- Web adapter gets a CSS `@media` block (no-JS path); native adapters get the clamp via
  the host calling `applyReducedMotion` before codegen — toolchain-uniform preference
  queries don't exist on iOS / Android / Flutter the way `@media` does on Web.
- `MOTION_REDUCED_EXCEEDS_SHORT` is the only new lint code. `MOTION_BASE_LONG` still
  covers the long-base-duration case.
- Native goldens regenerate to embed the new constant. The regen script is `/tmp/`-scoped
  for this PR; if this becomes a regular pattern, promote to `packages/native-parity/scripts/`.
