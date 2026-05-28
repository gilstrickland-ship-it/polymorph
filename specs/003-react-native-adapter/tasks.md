---

description: "Task list for Spec C — React Native Adapter"
---

# Tasks: React Native Adapter

**Input**: Design documents from `specs/003-react-native-adapter/`. Run with
`SPECIFY_FEATURE=003-react-native-adapter`.

## Phase 1: Setup

- [x] T001 `packages/adapter-react-native/package.json`: deps `@polymorph/core`/`@polymorph/spec`; peers `react` + optional `react-native`; devDeps `react`, `react-test-renderer`, `@types/react`, `@types/react-test-renderer`, `@types/node`, `vitest`; scripts test/typecheck.
- [x] T002 Set root `.npmrc` `auto-install-peers=false` so the optional `react-native` peer is not pulled into CI; reinstall.
- [x] T003 Add `tsconfig.typecheck.json` (jsx, types:["node"], include src+tests), `vitest.config.ts`, and `paths:{}` + `jsx` in the build `tsconfig.json`.
- [x] T004 Add ambient RN shim `src/types/react-native.d.ts` (View/Text/Pressable/TextInput/StyleSheet + style/prop types).

## Phase 2: Foundational (neutral core)

- [x] T005 `src/theme-bridge.ts`: `createBridge(resolved)` → `color/dim/num/typography/has`, throwing on absent tokens.
- [x] T006 `src/slots.ts`: `SlotName`, `SlotComponents`, `resolveSlot`.
- [x] T007 `src/component-map.ts`: `ComponentRegistry`, `resolveComponent`.
- [x] T008 `src/retrofit.ts`: `toTokenMap(resolved)` → pm-only, alias-free record.

## Phase 3: US1 — Provider + hooks (P1)

- [x] T009 `src/provider.ts`: `ThemeProvider`, context, `useTheme/useThemeBridge/useResolvedTheme/useSlot/useThemedComponent` (react only).
- [x] T010 `tests/provider.test.ts` (react-test-renderer): provides theme+bridge; `useSlot` override vs default; `useTheme` throws outside provider.

## Phase 4: US2/US3/US4 — slots, mapping, retrofit (P2)

- [x] T011 `tests/registries.test.ts`: `resolveSlot`, `resolveComponent`, `toTokenMap`.
- [x] T012 `tests/theme-bridge.test.ts`: color/dim/typography reads, presence, missing-token error.

## Phase 5: US5 — themed primitives (P3)

- [x] T013 `src/primitives.ts`: `Screen`, `Card`, `ThemedText`, `PrimaryButton`, `Field`, `StepIndicator` (the only `react-native` importer), styled via the bridge.
- [x] T014 `src/index.ts` barrel exporting the neutral core + primitives.

## Phase 6: Polish

- [x] T015 Build + typecheck (primitives vs RN shim) + neutral-core tests green; whole-workspace `nx run-many` green.

## Notes

- On-device rendering of primitives is verified in Spec D (demo + mock banks) — the container has
  no RN runtime.
- Tests/tools import neutral modules directly; the index pulls `react-native` via primitives.
