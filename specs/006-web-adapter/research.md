# Phase 0 Research: Web Adapter

## R1 — CSS custom properties as the bridge

**Decision**: Emit each resolved semantic token as a CSS custom property
(`--pm-<dotted-id-with-dashes>`), let the `ThemeProvider` inject them via a scoped `<style>` block,
and have the `ThemeBridge` return `var(--…)` references for components to spread into inline
styles.

**Rationale**: A flat `pm.* → value` map is a perfect fit for CSS custom properties. Theme swaps
update the stylesheet; the browser repaints; React consumers don't re-render. Far cheaper at
runtime than recomputing inline styles on every theme change.

**Alternatives**: Returning concrete values from the bridge (forces re-render on swap — rejected);
inlining values per element (loses the cascade — rejected).

## R2 — Typography composites

**Decision**: A `typography` token expands to **five CSS variables** (font-family, font-weight,
font-size, line-height, letter-spacing). The bridge's `typography(id)` returns an object whose
keys are CSS sub-properties and values are `var(--<id>-<sub>)` references — spread directly into
`style`.

**Rationale**: A single CSS variable can't hold a composite. Sub-vars keep the data model honest
and let consumers override individual sub-properties at any scope.

## R3 — Provider scoping

**Decision**: Generate a unique class per `ThemeProvider` instance via `useId()`, render
`.<class> { … }` in the injected `<style>`, and wrap children in a `<div>` with that class.
Callers may pass `scope` to use a known class instead.

**Rationale**: Lets multiple themes coexist on a page (e.g., a preview of Borealis embedded in an
Aurora-themed app). `useId` is SSR-stable.

**Alternatives**: `:root` injection (one theme per page — rejected); inline style on the wrapper
(no cascade for descendants outside the bridge — rejected).

## R4 — Same surface as the RN adapter

**Decision**: Mirror the RN adapter's `SlotName`, `ComponentRegistry`, `toTokenMap`, and hook set,
so vendor SDKs port between platforms with minimal friction.

**Rationale**: The contract is platform-neutral; the adapter shouldn't introduce gratuitous
asymmetry. Keeps the brownfield path identical across adapters.

## R5 — Testing without a browser

**Decision**: Test pure modules directly (vitest). Test the provider with `react-test-renderer`
(no DOM): inspect the rendered tree to find the `<style>` element and assert its content. No
jsdom needed.

**Rationale**: Matches the RN adapter's test approach; keeps CI fast and deterministic.

## R6 — React as an *optional* peer

**Decision**: `react` is a peer dependency marked optional in `peerDependenciesMeta`. The
framework-agnostic core (CSS vars + bridge + slots + mapping + retrofit) imports only
`@polymorph/spec` types, so consumers without React (Vue, plain JS) can use it.

**Rationale**: Honest dependency hygiene — the React binding is one of several future bindings;
declaring `react` as a hard runtime dep would lie to non-React consumers.
