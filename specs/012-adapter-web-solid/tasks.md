---

description: "Task list for Spec L — Web Adapter: Solid 1.x binding"
---

# Tasks: Web Adapter — Solid 1.x Binding

**Input**: Design documents from `specs/012-adapter-web-solid/`.

## Phase 1: Setup

- [x] T001 `packages/adapter-web-solid/package.json`: deps `@polymorph/spec`, `@polymorph/adapter-web`; optional peer `solid-js >= 1.8`; devDeps `@polymorph/core`, `solid-js`, `happy-dom`, `@types/node`, `vitest`.
- [x] T002 Add `@polymorph/adapter-web-solid` path mapping in `tsconfig.base.json`.
- [x] T003 `tsconfig.json` (build, `paths:{}`, `lib + DOM`), `tsconfig.typecheck.json` (`paths:{}`, `lib + DOM`, `types:["node"]`, include src+tests), `vitest.config.ts` with `environment: "happy-dom"` and `resolve.conditions: ["browser", "development"]`.

## Phase 2: Implementation (US1/US2)

- [x] T004 `src/types.ts`: Solid-typed `SlotComponents` / `ComponentRegistry` (using Solid's `Component`).
- [x] T005 `src/provider.ts`: `ThemeContext` (`createContext`) + `ThemeProvider` using `solid-js/h` (hyperscript). Uses `createUniqueId` for the scope class, `createMemo` for the bridge and CSS string, getter-backed context for reactive descendant reads.
- [x] T006 `src/composables.ts`: `useTheme`/`useThemeBridge`/`useResolvedTheme`/`useSlot`/`useThemedComponent` — all throw outside the provider.

## Phase 3: Primitives (US3)

- [x] T007 `src/primitives.ts`: `Screen`/`Card`/`Stack`/`ThemedText`/`PrimaryButton` via hyperscript; styles via `createMemo` for reactivity. ThemedText captures `tag` once at mount; documented.

## Phase 4: Tests

- [x] T008 `tests/provider.test.ts` (4): context + scoped `<style>` + theme-swap re-emits CSS + slot override resolution + `useTheme` throws outside provider.
- [x] T009 `tests/primitives.test.ts` (3): `ThemedText` tag/style + muted variant; `PrimaryButton` press event + disabled state. Solid's zero-arg-function-prop quirk documented and exercised via `(_e) => …` form.

## Phase 5: Polish

- [x] T010 `src/index.ts` barrel (re-exports framework-agnostic core from `@polymorph/adapter-web` + Solid-specific surface).
- [x] T011 `README.md` (includes the Solid event-prop quirk + workarounds) and `specs/012-adapter-web-solid/{spec,tasks}.md`.
- [x] T012 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **14 projects**.

## Notes

- Source uses `solid-js/h` (hyperscript), not JSX — keeps the build tsc-only. Consumers use JSX
  in their apps; Solid's compiler produces equivalent `createComponent` calls.
- `vitest.config.ts` sets `resolve.conditions: ["browser", "development"]` so vitest resolves
  Solid's client bundle in Node (without it, Solid routes to its SSR build and `h()`/`render()`
  throw "client-only API").
- Solid's `h()` promotes zero-arg function props on components to reactive accessors — write
  event-like callbacks with at least one parameter to opt out (documented in README).
