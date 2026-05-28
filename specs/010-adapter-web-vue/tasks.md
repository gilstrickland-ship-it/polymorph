---

description: "Task list for Spec J — Web Adapter: Vue 3 binding"
---

# Tasks: Web Adapter — Vue 3 Binding

**Input**: Design documents from `specs/010-adapter-web-vue/`.

## Phase 1: Setup

- [x] T001 `packages/adapter-web-vue/package.json`: deps `@polymorph/spec`, `@polymorph/adapter-web`; optional peer `vue >= 3.4`; devDeps `@polymorph/core`, `vue`, `@vue/test-utils`, `happy-dom`, `@types/node`, `vitest`.
- [x] T002 Add `@polymorph/adapter-web-vue` path mapping in `tsconfig.base.json`.
- [x] T003 `tsconfig.json` (build, `paths:{}`, `lib + DOM`), `tsconfig.typecheck.json` (`paths:{}`, `lib + DOM`, `types:["node"]`, include src+tests), `vitest.config.ts` with `environment: "happy-dom"`.

## Phase 2: Implementation (US1/US2)

- [x] T004 `src/types.ts`: `SlotName`, Vue-typed `SlotComponents`/`ComponentRegistry` (use Vue's `Component`), `ThemeContextValue`.
- [x] T005 `src/provider.ts`: `ThemeKey` injection key + `ThemeProvider` (defineComponent + render function). Computes scope via `getCurrentInstance().uid`, builds bridge + CSS, **unwraps `slots`/`components` props via `toRaw`** in the context getters.
- [x] T006 `src/composables.ts`: `useTheme`/`useThemeBridge`/`useResolvedTheme`/`useSlot`/`useThemedComponent`. All throw outside a provider.

## Phase 3: Primitives (US3)

- [x] T007 `src/primitives.ts`: `Screen`/`Card`/`Stack`/`ThemedText`/`PrimaryButton` via `defineComponent` + render functions; inline styles reference the bridge's `var(--…)` outputs.

## Phase 4: Tests

- [x] T008 `tests/provider.test.ts` (4): context + scoped `<style>` + theme-swap re-emits CSS + slot override resolution + `useTheme` throws outside provider.
- [x] T009 `tests/primitives.test.ts` (3): `ThemedText` tag/style + muted variant; `PrimaryButton` press event + disabled state.

## Phase 5: Polish

- [x] T010 `src/index.ts` barrel (re-exports framework-agnostic core from `@polymorph/adapter-web` + Vue-specific surface).
- [x] T011 `README.md` and `specs/010-adapter-web-vue/{spec,tasks}.md`.
- [x] T012 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **13 projects**.

## Notes

- No `.vue` SFC files (render functions only) — keeps the workspace TS-only and avoids a Vue
  compiler in the build.
- Component overrides survive Vue's reactive proxies via `toRaw` in the provider, so consumers
  compare by reference (`===`) without thinking about Vue internals.
