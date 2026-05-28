# Feature Specification: Web Adapter — Vue 3 Binding

**Spec ID**: 010-adapter-web-vue

**Created**: 2026-05-28

**Status**: Implemented

**Input**: First non-React binding for the web adapter. Concretely proves the framework-agnostic
core (CSS vars + `ThemeBridge` + slots + mapping + retrofit) is reusable across web frameworks,
not React-specific. Establishes the pattern for Angular/Solid/Svelte/PWA follow-ups.

---

## Overview

`@polymorph/adapter-web-vue` re-exports the framework-agnostic core from
`@polymorph/adapter-web` and adds Vue-flavoured glue:

- A `ThemeProvider` component (`defineComponent` + render function — no `.vue` SFC compiler).
  Provides `{theme, bridge, slots, components, scope}` via Vue's `provide`/`inject` under a
  `ThemeKey` injection key. Injects a scoped `<style>` block of CSS variables.
- Composables: `useTheme`, `useThemeBridge`, `useResolvedTheme`, `useSlot`, `useThemedComponent`.
- Themed primitives: `Screen`, `Card`, `Stack`, `ThemedText`, `PrimaryButton`. Render functions
  styled via the bridge's `var(--…)` references.

`vue >= 3.4` is an **optional peer dependency** so CI doesn't auto-install Vue.

---

## Clarifications

### Session 2026-05-28

- Q: SFC (`.vue`) or render functions? → A: **render functions** — keeps the workspace setup
  TS-only (no Vue SFC compiler in the build), and the surface is small enough that JSX/templates
  don't add much.
- Q: How are slot/component overrides protected from Vue's reactive proxies? → A: the provider
  applies **`toRaw`** to `props.slots` / `props.components` in its context getters so consumers
  get the original component references back (otherwise `useSlot` would return a reactive
  proxy of a component, which is not safe to pass to `h(…)`).
- Q: Polymorph "slots" vs Vue native `<slot>` — collision? → A: no collision in practice. The
  Polymorph "slots" prop is the override registry; Vue's native slots are accessed via the
  setup context's `slots` argument (and rendered with `<slot>` / `vSlots.default?.()`). Documented.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A Vue app consumes a `ResolvedTheme` (Priority: P1)

`<ThemeProvider :theme="resolved">` wraps the tree; descendants read theme values through the
bridge or use themed primitives. Switching `theme` updates the injected `<style>` (browser
repaints; consumers don't re-render unless they read theme-dependent values).

**Independent Test**: `tests/provider.test.ts` — mounted via `@vue/test-utils` in happy-dom;
asserts the scoped `<style>` contains the resolved CSS variables (incl. typography sub-vars) and
that swapping `theme` re-emits the stylesheet.

### User Story 2 — Render slots and component mapping (Priority: P2)

`useSlot("PrimaryButton", Default)` returns the host override when registered, else `Default`.
Same for `useThemedComponent(role, Default)`. Component overrides compare by **reference** —
Vue's reactive proxies don't leak through.

### User Story 3 — Themed primitives (Priority: P2)

The themed primitives (`ThemedText`, `PrimaryButton`, `Card`, `Stack`, `Screen`) render the
correct HTML element with inline styles that reference `var(--pm-…)`; `PrimaryButton` emits a
`press` event on click and renders a disabled state.

### Edge Cases

- `useTheme()` (and every composable) throws a clear error outside a `<ThemeProvider>`.
- Component overrides passed to `slots` / `components` props survive reactivity unwrap and
  compare by identity (`===`).
- Polymorph's `slots` *prop* never collides with Vue's native `<slot>` mechanism.

---

## Requirements *(mandatory)*

- **FR-001**: The package MUST re-export the framework-agnostic core from `@polymorph/adapter-web`
  (`toCssVariables`/`toCssVariablesString`/`createBridge`/`toTokenMap`, types).
- **FR-002**: `ThemeProvider` MUST inject a scoped `<style>` block and provide a context object
  with `{theme, bridge, slots, components, scope}` via `provide(ThemeKey, …)`.
- **FR-003**: The provider MUST unwrap `slots` / `components` props via `toRaw` so component
  references compare by identity.
- **FR-004**: Composables (`useTheme`, `useThemeBridge`, `useResolvedTheme`, `useSlot`,
  `useThemedComponent`) MUST throw a clear error outside a provider.
- **FR-005**: Vue MUST be an **optional peer** dependency; the package builds in CI without Vue
  auto-installed (devDep covers tests).
- **FR-006**: No `.vue` SFC files — render functions only — to avoid a Vue compiler in the build.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/provider.test.ts` (4 tests) — context shape, scoped `<style>` content, theme
  swap re-emits CSS, slot override vs default, throws outside provider.
- **SC-002**: `tests/primitives.test.ts` (3 tests) — `ThemedText` tag + style, muted variant,
  `PrimaryButton` press event + disabled state.
- **SC-003**: Whole workspace builds, typechecks, tests, and conforms from a cold state across
  the new project count (**13**).

---

## Assumptions

- Vue 3.4+ for the binding (we use `getCurrentInstance().uid` for the scope class; 3.5+ users can
  pass `scope` explicitly or migrate to `useId()` if they prefer).
- Angular / Solid / Svelte / PWA bindings are separate packages following this pattern — same
  framework-agnostic core, framework-specific provider + composables.
