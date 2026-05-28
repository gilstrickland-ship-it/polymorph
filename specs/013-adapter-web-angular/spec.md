# Feature Specification: Web Adapter — Angular 18+ Binding

**Spec ID**: 013-adapter-web-angular

**Created**: 2026-05-28

**Status**: Implemented

**Input**: Third non-React binding for the web adapter (after Vue and Solid). Angular is the
architecturally distinct remaining web framework — DI / decorators / standalone components — so
shipping a working binding completes the "one contract, many frontends" claim for the web core.

---

## Overview

`@polymorph/adapter-web-angular` re-exports the framework-agnostic core from
`@polymorph/adapter-web` and adds Angular-flavoured glue:

- A standalone `ThemeProviderComponent` (`<polymorph-theme-provider>`) that registers a
  per-instance `WritableSignal<ThemeContextValue | null>` via component-scoped `providers` under
  `THEME_TOKEN`. The `<style>` block is created imperatively via `Renderer2` (Angular extracts
  template `<style>` tags into styles arrays — they never reach the DOM as real elements).
- `inject()`-style helpers: `injectTheme`, `injectThemeBridge`, `injectResolvedTheme`,
  `injectSlot`, `injectThemedComponent`. All return accessor functions.
- Standalone themed primitives: `ThemedTextComponent`, `PrimaryButtonComponent`.

`@angular/core >= 18` is declared as an **optional peer** so CI doesn't auto-install Angular.

---

## Clarifications

### Session 2026-05-28

- Q: NgModule or standalone? → A: **Standalone components** (Angular 14+ stable, default in
  18+). Simpler to consume; no `NgModule` boilerplate.
- Q: Reactivity model — signals, RxJS, or `ngOnChanges`-only? → A: **Signals** for the context
  value (a `WritableSignal<ThemeContextValue | null>` per provider instance), `ngOnChanges` to
  write to it from inputs, and composables that return accessor functions so consumers can call
  them in `computed()` / `effect()` for reactivity.
- Q: Where does the CSS `<style>` block live? → A: created **imperatively via `Renderer2`** in
  the provider's constructor and updated in `ngOnChanges`. Template `<style>` tags are stripped
  by Angular's compiler.
- Q: Dynamic per-variant semantic tag for `ThemedText` (h2/small/label)? → A: **Not feasible** in
  Angular: multiple variant-conditional `<ng-content>` slots all sharing the default slot leave
  the active branch empty. We render `<span>` always; typography token still drives the visual.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — An Angular app consumes a `ResolvedTheme` (Priority: P1)

`<polymorph-theme-provider [theme]="resolved">` wraps the tree; descendants read theme values via
the `inject()` helpers (called in `ngOnInit` for a snapshot, or in `computed()` for reactivity).
The provider injects a scoped `<style>` element under its host, applying the variables to a
wrapper `<div class="pm-theme-…">`.

**Independent Test**: `tests/provider.test.ts` — `TestBed` mounts a host that wraps three probe
components inside the provider; assertions confirm theme/bridge/scope flow through DI and the
`<style>` element contains the resolved CSS variables.

### User Story 2 — Slots and component mapping (Priority: P2)

`injectSlot("PrimaryButton", Default)` returns the host override when registered, else `Default`.
Same for `injectThemedComponent(role, Default)`. Overrides compare by reference (Angular's DI
doesn't proxy values like Vue does).

### User Story 3 — Themed primitives (Priority: P2)

`ThemedTextComponent` (always `<span>`) and `PrimaryButtonComponent` render the right element
with inline styles referencing `var(--pm-…)`; the button emits a `press` event on click and
renders the disabled state.

### Edge Cases

- `injectTheme()` (and every helper) throws a clear error outside a `<polymorph-theme-provider>`.
- Probes must capture in `ngOnInit` (not the constructor) — at construction time the provider's
  `ngOnChanges` hasn't run and the signal is still null.
- Template `<style>` blocks are stripped by Angular's compiler; the provider creates the style
  element imperatively via `Renderer2`.

---

## Requirements *(mandatory)*

- **FR-001**: The package MUST re-export the framework-agnostic core from
  `@polymorph/adapter-web`.
- **FR-002**: `ThemeProviderComponent` MUST provide a per-instance `WritableSignal<ThemeContextValue | null>`
  under `THEME_TOKEN` via component-scoped `providers`, and update it in `ngOnChanges`.
- **FR-003**: The provider MUST inject a scoped `<style>` block into its host element via
  `Renderer2` (template `<style>` is stripped by Angular's template compiler).
- **FR-004**: Helpers (`injectTheme`, `injectThemeBridge`, `injectResolvedTheme`, `injectSlot`,
  `injectThemedComponent`) MUST throw a clear error outside a provider.
- **FR-005**: `@angular/core` MUST be an **optional peer** dependency.
- **FR-006**: No `NgModule` is required — provider, primitives, and probes are all standalone.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/provider.test.ts` (4) — DI flow (theme/bridge/scope), scoped `<style>`
  content, slot override resolution, throws outside provider.
- **SC-002**: `tests/primitives.test.ts` (3) — `ThemedText` renders + applies typography +
  colour; muted variant; `PrimaryButton` press event + disabled state.
- **SC-003**: Whole workspace builds, typechecks, tests, and conforms from a cold state across
  the new project count (**15**).

---

## Assumptions

- Angular 18+ for the binding; standalone components + signals.
- Tests use `TestBed` + zone.js + happy-dom; runtime in apps uses whichever change-detection
  strategy the consumer prefers (provider works under both Default and OnPush parents).
- The `ThemedText` always-`<span>` limitation is documented; users wrap with `<h2>`/`<small>`/
  etc. themselves if semantic markup matters.
