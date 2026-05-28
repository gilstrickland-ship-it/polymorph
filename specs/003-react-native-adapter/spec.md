# Feature Specification: React Native Adapter

**Spec ID**: 003-react-native-adapter

**Created**: 2026-05-27

**Status**: Implemented

**Input**: Spec C from the approved Polymorph plan — the first platform adapter. Takes a
`ResolvedTheme` (from `@polymorph/core` / a loader handle) and exposes it idiomatically to React
Native via a `ThemeProvider` + hooks, plus the **render-slot** mechanism, the optional role-based
**component-mapping** registry, a **retrofit** shim, and themed primitive components.

---

## Overview

`@polymorph/adapter-react-native` is the bridge between the neutral `ResolvedTheme` and an RN UI.
It is deliberately split:

- **Platform-neutral core** (no `react-native` import): the `ThemeBridge` (ergonomic accessors
  over a `ResolvedTheme`), the React `ThemeProvider` + hooks (`react` only), the render-slot
  registry, the component-mapping registry, and the retrofit `toTokenMap` shim. **Fully unit-
  tested here.**
- **Themed primitives** (`primitives.ts`, the only module importing `react-native`): `Screen`,
  `Card`, `ThemedText`, `PrimaryButton`, `Field`, `StepIndicator`. Typechecked here against an
  ambient RN type shim; **on-device rendering is verified in the Spec D demo**.

---

## Clarifications

### Session 2026-05-27

- Q: The cloud container can't run/test React Native — how to scope Spec C? → A: **Build and unit-
  test the platform-neutral adapter core now** (bridge, provider/hooks via react-test-renderer,
  slots, component-mapping, retrofit shim); **implement the themed RN primitives** as thin wrappers
  with `react-native` as an **optional peer dependency** (typechecked via an ambient shim), with
  on-device rendering verified in the Spec D demo.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Provide a theme to an RN tree (Priority: P1)

An app wraps its RN tree in `<ThemeProvider theme={resolved}>`; descendants read the theme via
`useTheme()` / `useThemeBridge()`. Switching the resolved theme (e.g. Aurora → Borealis) restyles
everything with no component code change.

**Independent Test**: Render `ThemeProvider` with a resolved theme; a consumer reads the same
theme object and the bridge returns correct token values. (react-test-renderer.)

**Acceptance Scenarios**:
1. **Given** a `ThemeProvider` with a resolved theme, **When** a child calls `useTheme()`, **Then**
   it receives that theme and a working `ThemeBridge`.
2. **Given** no provider, **When** `useTheme()` is called, **Then** it throws a clear error.

### User Story 2 — Override a slot (Priority: P2)

A host injects its own component for a named slot (e.g. `PrimaryButton`); the SDK renders the host
component there and its themed default everywhere else.

**Independent Test**: `useSlot("PrimaryButton", Default)` returns the host override when registered,
else `Default`.

### User Story 3 — Map a role to a host component (Priority: P2)

An FI with a component library maps an SDK role (e.g. `button.primary`) to its own component via the
registry; `useThemedComponent(role, Default)` returns it, else the themed default.

### User Story 4 — Retrofit an existing SDK (Priority: P2)

An existing RN SDK consumes `toTokenMap(resolved)` — a plain `pm.* → value` map — into its current
theme/style layer without adopting Polymorph's components (Constitution I/IV).

**Independent Test**: `toTokenMap` returns pm-only keys with concrete values (no aliases).

### User Story 5 — Themed primitives (Priority: P3)

The SDK ships default themed components (`Screen`, `Card`, `ThemedText`, `PrimaryButton`, `Field`,
`StepIndicator`) styled entirely from the bridge. Verified on-device in Spec D.

### Edge Cases

- `useTheme()` outside a provider throws.
- The bridge throws a clear "missing token" error if a primitive references an absent token.
- Importing the package index pulls `react-native` (via primitives); the neutral core modules do
  not — so tests/tools import the core modules directly.

---

## Requirements *(mandatory)*

- **FR-001**: A `ThemeProvider` MUST accept a `ResolvedTheme` and expose it (plus a `ThemeBridge`,
  slot registry, and component registry) via React context; `useTheme`/`useThemeBridge`/
  `useResolvedTheme` read it.
- **FR-002**: A `ThemeBridge` MUST provide RN-friendly typed accessors (`color`, `dim`, `num`,
  `typography`, `has`) over the `ResolvedTheme`, throwing a located error for an absent token.
- **FR-003**: A **render-slot** mechanism (`useSlot`/`resolveSlot`) MUST return a host override when
  registered, else the themed default.
- **FR-004**: An optional **component-mapping** registry (`useThemedComponent`/`resolveComponent`)
  MUST map a `ComponentRole` to a host component, else fall back to the themed default.
- **FR-005**: A **retrofit** shim (`toTokenMap`) MUST flatten a `ResolvedTheme` to a plain `pm.* →
  value` record with no aliases (FR-018–020 of Spec A).
- **FR-006**: The neutral core MUST NOT import `react-native`; only `primitives.ts` may. `react`
  and `react-native` are peer dependencies (`react-native` optional so it is not auto-installed in
  CI; an ambient type shim provides its types).
- **FR-007**: Themed primitives MUST style themselves exclusively via the `ThemeBridge` (semantic
  ids only — never primitives).

---

## Success Criteria *(mandatory)*

- **SC-001**: `useTheme()`/`useThemeBridge()` deliver the provided theme and correct token values
  (react-test-renderer).
- **SC-002**: Slot and component-mapping resolution return overrides when present, defaults otherwise.
- **SC-003**: `toTokenMap` output is pm-only, concrete, alias-free.
- **SC-004**: The package builds and typechecks (including primitives against the RN shim) with
  `react-native` not installed; the neutral core unit tests pass.

---

## Assumptions

- `@polymorph/core` provides `ResolvedTheme` and resolution; the adapter does not re-validate.
- On-device/visual verification of primitives happens in Spec D (the demo + mock banks).
- React 18 is used for tests (react-test-renderer); consumers may use React 18+.
