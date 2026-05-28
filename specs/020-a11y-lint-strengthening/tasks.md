---

description: "Task list for Spec T — A11y linter strengthening"
---

# Tasks: A11y Linter Strengthening

**Input**: Design documents from `specs/020-a11y-lint-strengthening/`.

## Phase 1: Lint-code surface

- [x] T001 `packages/core/src/errors.ts`: extend `LintCode` union with seven new codes — `CONTRAST_ON_INVERSE_LOW`, `CONTRAST_FEEDBACK_LOW`, `DISABLED_TEXT_LOW`, `FOCUS_RING_LOW`, `BORDER_DEFAULT_LOW`, `COMPONENT_CONTRAST_LOW`, `MOTION_BASE_LONG`.

## Phase 2: Manifest-driven linter (US1, US2, US3, P1)

- [x] T002 `packages/core/src/lint.ts`: rewrite `lintTheme(rt)` as eight rule-family helpers — `lintTextSurfaceMatrix`, `lintOnActionMatrix`, `lintOnInverse`, `lintFeedbackOnSurface`, `lintFocusAndBorder`, `lintComponentPairs`, `lintTouchTarget`, `lintDisabledOpacity`, `lintMotionDuration`. Source pairings from `TOKENS` (filtered by `group` + `type === "color"`) and `COMPONENT_ROLES`.
- [x] T003 `lint.ts`: WCAG thresholds — `AA_TEXT = 4.5` (SC 1.4.3), `AA_LARGE = 3.0` (large/disabled text), `AA_NON_TEXT = 3.0` (SC 1.4.11 — focus rings + borders). `MOTION_BASE_LONG` threshold 500ms (local guidance, not WCAG).
- [x] T004 `lint.ts`: `evaluatePair` returns `{ ratio, unparseable }` so `CONTRAST_SKIPPED_UNPARSEABLE` fires once per affected pair with both ids in `tokenIds`.

## Phase 3: Mode-spanning convenience (US4)

- [x] T005 `lint.ts`: `lintAllModes(theme)` — calls `declaredModes(theme)` then `resolveTheme` + `lintTheme` per mode; returns `{ mode: ThemeMode, warnings: LintWarning[] }[]`.

## Phase 4: Barrel + index

- [x] T006 `packages/core/src/index.ts`: export `lintAllModes` alongside `lintTheme`.

## Phase 5: Tests

- [x] T007 `tests/lint.test.ts`: adjust the existing `does not flag adequate contrast` + oklch/display-p3 tests to assert the specific `body → surface.base` pair (broader matrix means broader fires; tests must be specific about the pair under test).
- [x] T008 `tests/lint.test.ts` — strengthened block: 10 new tests covering Aurora's central-pair pass, `CONTRAST_FEEDBACK_LOW`, `FOCUS_RING_LOW`, `BORDER_DEFAULT_LOW`, `CONTRAST_ON_INVERSE_LOW`, `DISABLED_TEXT_LOW`, `MOTION_BASE_LONG`, the broadened `onAction` matrix across primary/secondary/danger, `COMPONENT_CONTRAST_LOW` on overridden button.primary, and `lintAllModes` shape.
- [x] T009 Total `tests/lint.test.ts` 16 tests; `packages/core` total 34 (was 24).

## Phase 6: Docs

- [x] T010 `docs/guide/advisory-lint.md`: rewrite to enumerate every rule family with code + threshold + pairings table. Add the `lintAllModes` snippet. Update the example output to reflect strengthened warnings. Document "what it doesn't check" (real reading scenarios, motion-reduce media query, per-locale typography).

## Phase 7: Verification

- [x] T011 `pnpm --filter @polymorph/core test` — 34/34 pass.
- [x] `pnpm --filter @polymorph/cli test` — existing CLI tests unaffected (linter is advisory; CLI surface unchanged).
- [x] T012 `pnpm --filter @polymorph/docs run build` — site rebuilds with the strengthened lint page.
- [x] T013 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **20 projects** (strengthening core in place; no new package).

## Notes

- Backwards-compatible by design — every previously-emitted code still fires on its original
  condition. New codes are additive. Themes that previously passed `lint --strict` may now
  fail it; that's the point of the strengthening, and the cure is either to fix the
  underlying contrast or to filter codes via `--json`.
- Aurora's fixture intentionally exercises the "outline button" + faded-disabled-text +
  bright-feedback-accents patterns. Those surface as advisory warnings; we document them as
  known-acceptable signals rather than fixture bugs. The central body/onAction pairings DO
  pass.
- A `motion.duration.reduced.*` token family would be the proper way to enforce
  `prefers-reduced-motion`. That's a contract change (additive minor bump) — out of scope
  for this spec.
- `lintAllModes` doesn't run resolution for absent modes (would throw) — only the modes the
  theme declares get a results entry.
