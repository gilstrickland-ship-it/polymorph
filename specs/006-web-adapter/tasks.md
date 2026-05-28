---

description: "Task list for Spec F — Web Adapter"
---

# Tasks: Web Adapter

**Input**: Design documents from `specs/006-web-adapter/`. Run with
`SPECIFY_FEATURE=006-web-adapter`.

## Phase 1: Setup

- [x] T001 `packages/adapter-web/package.json`: deps spec/core; peer react (optional in `peerDependenciesMeta`); devDeps react/react-test-renderer/@types/*/vitest; scripts build/typecheck/test.
- [x] T002 Add `@polymorph/adapter-web` path mapping in `tsconfig.base.json`.
- [x] T003 `tsconfig.json` (build, `paths:{}`, `jsx: react-jsx`, `lib: ["ES2022","DOM"]`) and `tsconfig.typecheck.json` (`paths:{}`, `lib + DOM`, include src+tests); `vitest.config.ts`.

## Phase 2: Framework-agnostic core (US2, P1)

- [x] T004 `src/css-vars.ts`: `toCssVarName`, per-type `toCssEntries` (color/dimension/duration/number/cubicBezier/shadow/typography→5 sub-vars), `toCssVariables`, `toCssVariablesString` (selector defaults to `:root`).
- [x] T005 `src/theme-bridge.ts`: `createBridge` returning `var(--…)` references and a typography object of sub-var refs; throws on missing tokens.
- [x] T006 `src/slots.ts`: `SlotName`, `SlotComponents`, `resolveSlot`.
- [x] T007 `src/component-map.ts`: `ComponentRegistry`, `resolveComponent`.
- [x] T008 `src/retrofit.ts`: `toTokenMap` (concrete values, mirrors RN adapter).

## Phase 3: React binding (US1, P1)

- [x] T009 `src/provider.tsx`: `ThemeProvider` (injects scoped `<style>`, provides context), `useTheme`/`useThemeBridge`/`useResolvedTheme`/`useSlot`/`useThemedComponent`.
- [x] T010 `src/primitives.tsx`: `Screen`, `Card`, `Stack`, `ThemedText`, `PrimaryButton`, `Field`, `StepIndicator` — themed via the bridge.

## Phase 4: Tests

- [x] T011 `tests/css-vars.test.ts`: per-type entries (incl. typography expansion + shadow array); stylesheet generation under `:root` and a custom selector.
- [x] T012 `tests/theme-bridge.test.ts`: bridge returns expected `var(--…)` strings; missing tokens throw.
- [x] T013 `tests/registries.test.ts`: slot override / fallback; component registry; retrofit `toTokenMap` returns concrete values.
- [x] T014 `tests/provider.test.ts` (react-test-renderer): provider injects scoped `<style>` containing the resolved variables and a working bridge through context; `useSlot` override behaviour; hooks throw outside a provider.

## Phase 5: Polish

- [x] T015 `src/index.ts` barrel.
- [x] T016 `README.md` and `specs/006-web-adapter/{spec,plan,research,quickstart,contracts,tasks}.md`.
- [x] T017 Whole-workspace cold `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **10 projects**.

## Notes

- On-device verification (capturing CSS-var output in a real browser, golden screenshots) plugs in
  via the `GoldenHarness` interface from `@polymorph/conformance` in a follow-up.
- Vue/Angular/PWA bindings consume the framework-agnostic core (`css-vars` + `theme-bridge`) from
  their own packages.
