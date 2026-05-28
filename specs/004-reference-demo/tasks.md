---

description: "Task list for Spec D — Reference Demo + Mock Banks"
---

# Tasks: Reference Demo + Mock Banks

**Input**: Design documents from `specs/004-reference-demo/`. Run with
`SPECIFY_FEATURE=004-reference-demo`.

## Phase 1: Setup

- [x] T001 Add a `Stack` layout primitive to `@polymorph/adapter-react-native` (theme-driven gap) so the SDK composes layout without `react-native` or hardcoded sizes; rebuild the adapter.
- [x] T002 Wire `examples/reference-sdk-onboarding/package.json` (deps adapter/spec/react; dev core/vitest/@types) + `tsconfig.typecheck.json` (`paths:{}`, jsx) + `vitest.config.ts`.
- [x] T003 Wire `mock-bank-aurora` and `mock-bank-borealis` package.json (deps adapter/core/spec/reference-sdk/react) + typecheck configs.

## Phase 2: Mock-bank themes (US2)

- [x] T004 Author `examples/gen-mock-bank-themes.mjs`: generate complete, distinct `light`+`dark` themes from the contract manifest for Aurora (cool/blue/rounded) and Borealis (warm/green/sharp).
- [x] T005 Generate `mock-bank-aurora/theme/aurora.tokens.json` and `mock-bank-borealis/theme/borealis.tokens.json`; confirm both validate via `@polymorph/core`.

## Phase 3: Reference SDK (US3, P1)

- [x] T006 `examples/reference-sdk-onboarding/src/onboarding.tsx`: a 3-step account-opening wizard (welcome, validated details form, review + disclosure) using only adapter components.
- [x] T007 `examples/reference-sdk-onboarding/src/index.ts` exporting `Onboarding`.

## Phase 4: Host shells (US4)

- [x] T008 `mock-bank-aurora/src/App.tsx` + `index.ts`: `ThemeProvider` (resolved Aurora theme) hosting the unmodified `Onboarding`.
- [x] T009 `mock-bank-borealis/src/App.tsx` + `index.ts`: same, with the Borealis theme — differs only by the theme import.

## Phase 5: Proofs (US1, P1)

- [x] T010 `tests/reskin.test.ts`: both banks valid; the SDK's used tokens resolve in both; brand tokens + control radius differ; dark ≠ light.
- [x] T011 `tests/contract-adherence.test.ts`: SDK source has no hex/`rgb()`, no `react-native` import, no bank import; imports limited to adapter/spec/react.

## Phase 6: Polish

- [x] T012 Whole-workspace `nx run-many -t build typecheck test` green (9 projects); update example READMEs.

## Notes

- On-device rendering + golden screenshots are deferred to a device run / Spec E.
- Proof tests import only `@polymorph/core` + node so they run headlessly; they never import the
  SDK's RN components.
