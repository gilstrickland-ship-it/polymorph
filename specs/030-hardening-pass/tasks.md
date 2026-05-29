---

description: "Task list for Spec AD — hardening pass over policy packs + builder + lint types"
---

# Tasks: Hardening Pass

**Input**: Design documents from `specs/030-hardening-pass/`.

## Phase 1: Lint code + warning shape (FR-001 / FR-002 / FR-003 / FR-004)

- [x] T001 `packages/core/src/errors.ts`: add `POLICY_RULE_ERROR` to the `LintCode` union.
- [x] T002 `packages/core/src/errors.ts`: widen `LintWarning.measured` / `LintWarning.threshold` to optional (`number | undefined`). Doc the rationale (most policy-pack codes don't carry numeric pairs).
- [x] T003 `packages/core/src/policy-packs.ts`: drop the `measured: 0, threshold: 0` from the runtime's `POLICY_RULE_ERROR` emit.
- [x] T004 `packages/core/src/policy-packs.ts`: `warning()` helper accepts `measured?`/`threshold?` and skips setting them on the returned object when `undefined`.

## Phase 2: Per-mode helper (FR-008)

- [x] T005 `packages/core/src/policy-packs.ts`: `lintAllModesWithPolicies(theme, packs)` — `lintAllModes` parallel that composes packs on top.
- [x] T006 `packages/core/src/index.ts`: re-export `lintAllModesWithPolicies`.

## Phase 3: Builder component-override fix (FR-005 / FR-006 / FR-007)

- [x] T007 `packages/builder/src/use-theme-editor.ts`: in `setComponentProperty`, write under `pm.<role>.<property>` (the resolver's read path). Dotted roles split into segments.
- [x] T008 New `changedComponentPaths: ReadonlySet<string>` on `ThemeEditorState`.
- [x] T009 `diffPaths` walker imports `COMPONENT_ROLES` from `@polymorph/spec`, builds a top-segment lookup set, and classifies `pm.<x>.…` paths into `tokens` vs. `componentPaths`.
- [x] T010 `dirty` derives from `changedTokenIds.size > 0 || changedComponentPaths.size > 0`.

## Phase 4: Tests (SC-001 / SC-002 / SC-003)

- [x] T011 `packages/core/tests/policy-packs.test.ts`: 4 new tests — `POLICY_RULE_ERROR` carries no `measured` / `threshold`; `warning()` omits both / carries both / carries only `measured`; plus 3 for `lintAllModesWithPolicies` (per-mode entries, built-in + pack composition, empty-pack equivalence).
- [x] T012 `packages/builder/tests/use-theme-editor.test.tsx`: 3 new tests — `setComponentProperty` writes to the right path, dirties + surfaces under `changedComponentPaths` (not `changedTokenIds`), single-segment role names.

## Phase 5: Docs (SC-005)

- [x] T013 `docs/guide/advisory-lint.md`: add a `POLICY_RULE_ERROR` paragraph to Diagnostics.
- [x] T014 `docs/guide/policy-packs.md`: note `measured` / `threshold` are optional; document `lintAllModesWithPolicies`; update `warning()` example to show the no-numeric variant.
- [x] T015 `docs/guide/builder.md`: add `changedComponentPaths` row; correct `setComponentProperty`'s description to reflect the resolver-aligned path.

## Phase 6: Verification (SC-004)

- [x] T016 `pnpm --filter @polymorph/core test` — **68 tests** (was 61; +7).
- [x] T017 `pnpm --filter @polymorph/builder test` — **34 tests** (was 31; +3).
- [x] T018 `pnpm --filter @polymorph/docs run build` — site rebuilds, no broken links.
- [x] T019 Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **22 projects**.

## Notes

- Four surgical fixes, no architectural change.
- The `setComponentProperty` bug never surfaced because no consumer actually depended on
  it — `ThemeEditorRoot` only edits tokens. Caught during the hardening audit.
- Severity axis, alpha-color normalisation, and `ThemeEditorRoot`-level component editing
  are explicit non-goals here. Future cycles.
