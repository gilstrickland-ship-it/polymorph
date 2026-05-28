# Feature Specification: Web Adapter

**Spec ID**: 006-web-adapter

**Created**: 2026-05-28

**Status**: Implemented

**Input**: First post-v1 adapter (Spec F). Takes a `ResolvedTheme` and exposes it idiomatically
to the web via **CSS custom properties** plus a React binding (provider, hooks, render slots,
component-mapping registry, retrofit shim, themed HTML primitives). Proves the contract is
genuinely cross-platform — the same `ResolvedTheme` now drives RN and the web with no contract
changes.

---

## Overview

`@polymorph/adapter-web` is the web counterpart to `@polymorph/adapter-react-native`, structured
the same way:

- **Framework-agnostic core** — `toCssVariables` / `toCssVariablesString` (the CSS-vars emitter,
  pure), `ThemeBridge` returning `var(--…)` references, the slot + component-mapping registries,
  and the `toTokenMap` retrofit shim. No `react` import.
- **React binding** — `ThemeProvider` (injects a scoped `<style>` block + provides context),
  hooks (`useTheme`/`useThemeBridge`/`useResolvedTheme`/`useSlot`/`useThemedComponent`), and
  themed HTML primitives (`Screen`, `Card`, `Stack`, `ThemedText`, `PrimaryButton`, `Field`,
  `StepIndicator`).

CSS variables are the natural fit for a flat `pm.* → value` map: swapping `theme` updates the
variables and the browser repaints — no React re-render of style consumers needed.

---

## Clarifications

### Session 2026-05-28

- Q: How does the bridge return values on the web? → A: **`var(--…)` references** rather than
  concrete values, so styles flow through the provider's stylesheet and theme switches are cheap.
- Q: How are typography composites encoded as CSS variables? → A: **One variable per
  sub-property** (`--pm-typography-body-font-family`, `--pm-typography-body-font-size`, …),
  because a single CSS variable can't hold a multi-property composite.
- Q: How are themes scoped on a page? → A: The provider injects a `<style>` block scoped to a
  unique wrapper class (or a caller-supplied `scope`), so nested or side-by-side themes work.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A web app consumes a `ResolvedTheme` via React (Priority: P1)

An app wraps its tree in `<ThemeProvider theme={resolved}>`; descendants read theme values through
the bridge or directly use CSS variables. Switching the resolved theme updates the injected
stylesheet, no component re-renders needed.

**Independent Test**: `ThemeProvider` renders a `<style>` block scoped to its wrapper class
containing every resolved CSS variable (incl. typography sub-vars); `useThemeBridge().color(id)`
returns `var(--pm-…)`.

### User Story 2 — Framework-agnostic CSS emission (Priority: P1)

Any web stack (Vue, plain JS, server-rendered) can call `toCssVariablesString(resolved, scope?)`
and inject the result via a `<style>` element, with no React involvement.

**Independent Test**: `toCssVariablesString(resolved)` produces a stylesheet body under
`:root` (or a passed selector) listing every resolved token as a CSS variable.

### User Story 3 — Slots & component mapping (Priority: P2)

Same shape as the RN adapter: hosts override named slots; an optional role-based registry maps
SDK component roles to host components.

### User Story 4 — Retrofit an existing web SDK (Priority: P2)

`toTokenMap(resolved)` returns concrete `pm.* → value` pairs an existing SDK can read into its
theme/style API without adopting Polymorph's components (Constitution Principle I/IV).

### Edge Cases

- An unknown semantic id throws a clear "missing token" error from the bridge.
- Typography composites generate sub-vars; missing sub-properties skip silently.
- Multiple `ThemeProvider`s on a page each scope to their own class — no global collision.

---

## Requirements *(mandatory)*

- **FR-001**: The package MUST provide `toCssVariables(resolved)` (returns `Record<string,string>`)
  and `toCssVariablesString(resolved, selector?)` (renders a stylesheet body).
- **FR-002**: CSS variable naming MUST be `--<dotted-id-with-dashes>` (`pm.color.surface.base` →
  `--pm-color-surface-base`); typography composites expand to one variable per sub-property.
- **FR-003**: The `ThemeBridge` MUST return `var(--…)` references for color/dim/num and an
  object of var-refs for typography, so styles resolve via the provider's stylesheet.
- **FR-004**: `ThemeProvider` MUST inject a `<style>` block scoped to a wrapper element (a unique
  per-instance class by default, or a caller-supplied `scope`) and provide context with
  `{ theme, bridge, slots, components, scope }`.
- **FR-005**: Hooks `useTheme`/`useThemeBridge`/`useResolvedTheme`/`useSlot`/`useThemedComponent`
  MUST throw a clear error outside a provider.
- **FR-006**: `toTokenMap(resolved)` MUST return concrete `pm.* → value` pairs (mirrors the RN
  adapter's retrofit surface so the brownfield path is identical across adapters).
- **FR-007**: The framework-agnostic core MUST NOT import `react`. Only the React binding does.

---

## Success Criteria *(mandatory)*

- **SC-001**: CSS emission produces a stylesheet body containing every resolved token (incl.
  typography sub-vars); selector defaults to `:root`, overridable.
- **SC-002**: Bridge returns the expected `var(--…)` strings and throws on missing tokens.
- **SC-003**: `ThemeProvider` injects a scoped `<style>` block matching its wrapper class and
  provides a working bridge through context (react-test-renderer test).
- **SC-004**: Whole workspace builds, typechecks, tests, and conforms from a cold state across
  the new project count.

---

## Assumptions

- React 18+ for the binding (mirrors the RN adapter's React peer).
- On-device verification (running real browsers, golden screenshots) is captured via the
  `GoldenHarness` interface from `@polymorph/conformance` in a follow-up; the headless tests here
  prove the data path.
- Vue/Angular/PWA bindings will live in their own follow-up packages consuming the same
  framework-agnostic core.
