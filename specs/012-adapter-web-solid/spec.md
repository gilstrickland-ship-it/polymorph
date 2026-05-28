# Feature Specification: Web Adapter — Solid 1.x Binding

**Spec ID**: 012-adapter-web-solid

**Created**: 2026-05-28

**Status**: Implemented

**Input**: Second non-React binding for the web adapter. Extends the "framework-agnostic" claim
to a third frontend framework with a fundamentally different reactivity model (Solid's signals
and fine-grained reactivity vs React/Vue's component re-render cycle).

---

## Overview

`@polymorph/adapter-web-solid` re-exports the framework-agnostic core from
`@polymorph/adapter-web` and adds Solid-flavoured glue:

- A `ThemeProvider` component (`solid-js/h` hyperscript — no JSX/babel build pipeline).
  Provides `{theme, bridge, slots, components, scope}` via Solid's `createContext`.
- Composables: `useTheme`, `useThemeBridge`, `useResolvedTheme`, `useSlot`, `useThemedComponent`.
- Themed primitives: `Screen`, `Card`, `Stack`, `ThemedText`, `PrimaryButton`.

`solid-js >= 1.8` is declared as an **optional peer** so CI doesn't auto-install Solid.

---

## Clarifications

### Session 2026-05-28

- Q: JSX (needs babel/vite-plugin-solid) or hyperscript? → A: **hyperscript** (`solid-js/h`).
  Keeps the build tsc-only and matches the Vue binding's render-function pattern. Consumers can
  write their own JSX in apps — it compiles to the same `createComponent` calls.
- Q: How are zero-argument function props handled given Solid's reactive-accessor promotion? →
  A: **document the Solid convention** — event-like callbacks should take at least one parameter
  (e.g. `onPress: (e) => …`) so Solid leaves them as plain functions. Getter-style props are a
  fallback. The PrimaryButton test takes `(_e) => …` to exercise the path.
- Q: How does vitest run Solid headlessly without Solid SSR routing? → A:
  `resolve.conditions: ["browser", "development"]` in `vitest.config.ts` forces Solid's client
  bundle; `happy-dom` provides the DOM. No `vite-plugin-solid` needed because the source uses
  hyperscript (no JSX transform required).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A Solid app consumes a `ResolvedTheme` (Priority: P1)

`<ThemeProvider theme={resolved}>` wraps the tree; descendants read theme values through the
bridge or use themed primitives. Switching `theme` updates the injected `<style>` via Solid's
fine-grained reactivity (signals + memos).

**Independent Test**: `tests/provider.test.ts` — mounted via `render()` into a happy-dom
document; asserts the scoped `<style>` contains the resolved CSS variables (incl. typography
sub-vars) and that swapping `theme` re-emits the stylesheet on the same DOM node (no remount).

### User Story 2 — Slots and component mapping (Priority: P2)

`useSlot("PrimaryButton", Default)` returns the host override when registered, else `Default`.
Same for `useThemedComponent(role, Default)`. Component overrides compare by reference.

### User Story 3 — Themed primitives (Priority: P2)

`ThemedText`/`PrimaryButton`/`Card`/`Stack`/`Screen` render the right HTML element with inline
styles that reference `var(--pm-…)`; `PrimaryButton` fires `onPress` on click and renders a
disabled state.

### Edge Cases

- `useTheme()` (and every composable) throws a clear error outside a `<ThemeProvider>`.
- Solid's reactive-accessor promotion of zero-arg function props is documented; tests use
  `(_e) => …` form.
- `tag` of `ThemedText` is captured once on mount (variant typically doesn't change mid-life);
  styles remain reactive via `createMemo`.

---

## Requirements *(mandatory)*

- **FR-001**: The package MUST re-export the framework-agnostic core from `@polymorph/adapter-web`.
- **FR-002**: `ThemeProvider` MUST inject a scoped `<style>` block and provide a context object
  with `{theme, bridge, slots, components, scope}` via Solid's `createContext`/`Provider`.
- **FR-003**: Composables MUST throw a clear error outside a provider.
- **FR-004**: `solid-js` MUST be an **optional peer** dependency; the package builds in CI
  without Solid auto-installed.
- **FR-005**: Source MUST use `solid-js/h` hyperscript (no JSX) so the build stays tsc-only.
- **FR-006**: `vitest.config.ts` MUST set `resolve.conditions: ["browser", "development"]` so
  Solid routes to its client bundle under happy-dom.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/provider.test.ts` (4) — context shape, scoped `<style>` content, theme swap
  re-emits CSS, slot override resolution, throws outside provider.
- **SC-002**: `tests/primitives.test.ts` (3) — `ThemedText` tag + style; muted variant;
  `PrimaryButton` click fires `onPress` and renders the disabled state.
- **SC-003**: Whole workspace builds, typechecks, tests, and conforms from a cold state across
  the new project count (**14**).

---

## Assumptions

- Solid 1.8+ for the binding (we use `createUniqueId` for scope-class generation).
- Source uses hyperscript so we don't need a JSX/babel toolchain in the build pipeline.
  Consumers can use JSX in their apps — Solid's compiler turns JSX into the same
  `createComponent` calls our `h()` produces.
