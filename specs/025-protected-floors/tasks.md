---

description: "Task list for Spec Y — protected-surface floors"
---

# Tasks: Protected-Surface Floors

**Input**: Design documents from `specs/025-protected-floors/`.

## Phase 1: Manifest (FR-001)

- [x] T001 `packages/spec/manifest/protected-floors.v0.json`: new file declaring floors per role. Seed floor: `disclosure` with three rules (contrast 7:1 vs `pm.color.surface.base`, fontSize ≥ 14px via `typography`, lineHeight ≥ 1.5 via `typography`).

## Phase 2: Generator (FR-002)

- [x] T002 `packages/spec/scripts/generate.ts`: load the protected-floors manifest and emit `PROTECTED_FLOORS` + typed `ProtectedFloor` / `ProtectedFloorRule` / `ProtectedFloorKind` into `src/generated/contract-ids.ts`. No schema changes.
- [x] T003 `packages/spec/src/index.ts`: re-export the new const + types.
- [x] T004 Regenerate via `pnpm --filter @polymorph/spec generate`.

## Phase 3: Lint (FR-003 — FR-007)

- [x] T005 `packages/core/src/errors.ts`: add `PROTECTED_CONTRAST_LOW`, `PROTECTED_FONT_SIZE_SMALL`, `PROTECTED_LINE_HEIGHT_TIGHT` to the `LintCode` union.
- [x] T006 `packages/core/src/lint.ts`: new `lintProtectedFloors` rule. Iterates `PROTECTED_FLOORS`; for each rule, reads the resolved component property at `rt.components[role][property]` and evaluates the floor (contrast / fontSize / lineHeight). Skips floors whose role has no resolved properties; skips contrast rules when the foreground / background is unparseable.
- [x] T007 Helper functions: `fontSizePx(typography)` extracts the px size; `lineHeightMultiplier(typography)` extracts the multiplier. Both return `null` when the input isn't a valid typography composite.
- [x] T008 Wire `lintProtectedFloors` into `lintTheme`.

## Phase 4: Tests (SC-001)

- [x] T009 `packages/core/tests/protected-floors.test.ts` — 9 tests: 2 manifest shape (disclosure floor present + every floor has a valid role), 4 over defaulted Aurora (3 codes fire + tokenIds includes `disclosure.typography`), 3 over lifted overrides (each code clears when the role is overridden with body-class values).

## Phase 5: Docs

- [x] T010 `docs/guide/protected-surfaces.md`: new page — floor table, override pattern with JSON, why-advisory-not-blocking, why-separate-manifest, composition with the standard lint, what-isn't-shipped, see-also.
- [x] T011 `docs/guide/advisory-lint.md`: new "Protected-surface floors" subsection with the three new codes; cross-link to the dedicated page.
- [x] T012 `docs/.vitepress/config.ts`: add the page to the Guide sidebar.

## Phase 6: Verification

- [x] T013 `pnpm --filter @polymorph/core test` — 52 tests green (was 43; +9 new).
- [x] T014 `pnpm --filter @polymorph/docs run build` — site rebuilds; no broken-link warnings.
- [x] T015 Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **21 projects** (no new package).

## Notes

- Floors are a **separate manifest file** because they're lint-level, not structural.
  Bundling them with `semantic-vocabulary.v0.json` would churn the schema generator on
  every threshold tweak.
- Floors versioning is **independent of the contract version**. Tightening a threshold
  doesn't bump `contractVersion`; it's an advisory adjustment.
- The `disclosure` role's defaults stay soft on purpose — the lint surfaces the gap, the
  FI overrides for protected copy. Tightening the role defaults instead would break every
  existing FI's caption styling.
- Three independent codes (not one combined `PROTECTED_FLOOR_VIOLATION`) so FIs can
  prioritise: contrast fix is usually a quick swap; font-size / line-height changes
  usually require a typography composite override and design review.
- Advisory only. The constitution forbids blocking lint; CI gating is the FI's policy. The
  contract surfaces the signal, not the policy.
