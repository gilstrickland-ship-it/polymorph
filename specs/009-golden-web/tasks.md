---

description: "Task list for Spec I — Golden Web (headless on-device verification)"
---

# Tasks: Golden Web

**Input**: Design documents from `specs/009-golden-web/`. Closes the deferred golden-screenshot
thread from Specs C / D / E.

## Phase 1: Setup

- [x] T001 `packages/golden-web/package.json`: deps `@polymorph/spec`, `@polymorph/core`, `@polymorph/adapter-web`, `@polymorph/conformance`, `satori` (pinned), `@resvg/resvg-js` (pinned), `pixelmatch`, `pngjs`, `@fontsource/inter`; devDeps `@types/*`, `tsx`, `vitest`; scripts `build/typecheck/test/update-baselines`.
- [x] T002 Add `@polymorph/golden-web` path mapping in `tsconfig.base.json`.
- [x] T003 `tsconfig.json` (build, `paths:{}`), `tsconfig.typecheck.json` (`paths:{}`, include src+tests+scripts), `vitest.config.ts` with a 15s timeout.

## Phase 2: Renderer (US1, P1)

- [x] T004 `src/font.ts`: load Inter regular + bold via `createRequire` + `@fontsource/inter`; export `SATORI_FONTS` typed against satori's `Weight`/`style` literal unions.
- [x] T005 `src/scenarios.ts`: `WebGoldenScenario` type + a default `accountCardScenario` (400×300) that exercises the bank-defining tokens (surface, action, radii, spacing) from a `toTokenMap` record.
- [x] T006 `src/render.ts`: `renderScenarioToPng(scenario, theme, mode)` — `resolveTheme` → `toTokenMap` → scenario tree → satori SVG → resvg PNG.

## Phase 3: Diff + Harness (US1/US2, P1)

- [x] T007 `src/diff.ts`: `diffPngs(actual, baseline, threshold?)` with pixelmatch + pngjs; returns `{ match, diffRatio, diffPng? }`.
- [x] T008 `src/harness.ts`: `createWebGoldenHarness({ baselineDir, update?, threshold? })` returning a `GoldenHarness`; `capture` validates the payload, `compare` reads/writes the baseline file.
- [x] T009 `src/index.ts` barrel.

## Phase 4: Baselines + tests (US1/US2/US3)

- [x] T010 `scripts/update-baselines.ts`: render every scenario × bank × mode and write to `baselines/`.
- [x] T011 Generate the 4 committed baselines (`account-card-{aurora,borealis}-{light,dark}.png`).
- [x] T012 `tests/golden.test.ts`: 4 match-baseline tests + 2 distinctness tests (Aurora ≠ Borealis, light ≠ dark) + 2 surface checks (payload validation, missing baseline reported).

## Phase 5: Polish

- [x] T013 `README.md` and `specs/009-golden-web/{spec,tasks}.md`.
- [x] T014 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **12 projects**.

## Notes

- Pure-Node by design (Playwright CDN was unreachable in the build environment, and the
  satori/resvg path is faster, smaller, and deterministic). A browser-backed harness can land
  later as a sibling package implementing the same `GoldenHarness` interface.
- Font fidelity is not part of the diff — we bundle Inter and ignore the theme's font family.
