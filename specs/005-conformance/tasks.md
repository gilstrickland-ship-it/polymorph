---

description: "Task list for Spec E — Conformance Suite"
---

# Tasks: Conformance Suite

**Input**: Design documents from `specs/005-conformance/`. Run with
`SPECIFY_FEATURE=005-conformance`.

## Phase 1: Setup

- [x] T001 `packages/conformance/package.json`: deps core/loaders/spec; devDeps @types/node + vitest; scripts build/typecheck/test + a `conformance` script (vitest run); `paths:{}` build tsconfig + `tsconfig.typecheck.json` + `vitest.config.ts`.

## Phase 2: Reusable assertions (US1/US2)

- [x] T002 `src/checks.ts`: `ConformanceCheck`/`ConformanceReport`, `checkResolvedInvariants` (required present, no aliases, pm-only keys, component fallback), `runThemeConformance` (validity + per-mode invariants), `assertConforms` (throws itemized failures).

## Phase 3: Loader equivalence (US3)

- [x] T003 `src/loader-equivalence.ts`: `checkLoaderEquivalence(theme, mode)` comparing Inline/Bundled/RemoteManifest resolutions.

## Phase 4: Golden harness (US4, deferred)

- [x] T004 `src/golden.ts`: `GoldenHarness` interface + `GoldenHarnessUnavailableError` + `headlessGoldenHarness` placeholder (throws — needs a renderer).
- [x] T005 `src/index.ts` barrel.

## Phase 5: Run the acceptance corpus (FR-003)

- [x] T006 `tests/conformance.test.ts`: Aurora + Borealis conform; spec valid fixtures conform; invalid fixtures do not; loader equivalence for both banks across light+dark; `assertConforms` passes/throws.

## Phase 6: Polish

- [x] T007 `pnpm conformance` and whole-workspace `nx run-many -t build typecheck test conformance` green (9 projects); update the conformance README.

## Notes

- Golden-screenshot capture/diff is deferred to an on-device run (Expo/RN); the `GoldenHarness`
  interface is the seam so it plugs in without changing the headless suite.
