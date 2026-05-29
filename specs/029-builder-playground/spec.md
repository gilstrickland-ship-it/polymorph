# Feature Specification: Builder Playground Example

**Spec ID**: 029-builder-playground

**Created**: 2026-05-29

**Status**: Implemented

**Input**: `@polymorph/builder` shipped headless React primitives for theme editing, but
the docs only described the surface — no end-to-end example. This spec ships
`examples/builder-playground`: the builder composed with the web adapter's themed
primitives + Aurora's theme, in a single workspace package that's typechecked + tested
the same way every other example is.

---

## Overview

| Surface | Purpose |
|---|---|
| `examples/builder-playground/src/Playground.tsx` | `<ThemeEditorRoot>` with Aurora's theme + a `renderPreview` slot wired to `<ThemeProvider>` + a Web-adapter-themed showcase. |
| `examples/builder-playground/src/Showcase.tsx` | Small component composition (Stack / Card / ThemedText / Field / StepIndicator / PrimaryButton) that consumes the resolved theme. |
| `examples/builder-playground/tests/integration.test.tsx` | RTL-driven test verifying editor + preview wiring end-to-end. |
| Workspace plumbing | `package.json`, `tsconfig.typecheck.json`, `vitest.config.ts` matching the project's pattern. |

The example doesn't ship a Vite SPA / HTML / build pipeline — every other example is a
typechecked workspace package with vitest, and this matches. Hosts that want to mount the
playground as a real app pull the `Playground` component into their own renderer.

---

## Clarifications

### Session 2026-05-29

- Q: Ship a full Vite SPA or a workspace-package + tests? → A: **Workspace package +
  tests.** Matches the existing example pattern (mock-bank-aurora, mock-bank-borealis,
  reference-sdk-onboarding); no per-example build pipeline to maintain; integration
  asserted via RTL instead of "open the browser and click around".
- Q: Use the React Native reference SDK as the preview showcase? → A: **No — use the Web
  adapter's themed primitives.** The reference SDK is React Native, not directly
  renderable in DOM tests. The Web adapter ships `<Card>` / `<Field>` /
  `<PrimaryButton>` / `<StepIndicator>` / `<ThemedText>` — the same primitive set,
  DOM-renderable.
- Q: Mirror the editor's mode state in the parent? → A: **No.** Originally tried it via
  `queueMicrotask(() => setActiveMode(mode))`, which produced React `act()` warnings.
  `ThemeEditorRoot` manages its own mode internally — the playground reads `mode` inside
  `renderPreview` directly.
- Q: Which tokens to expose in the editor list? → A: **A trimmed high-leverage set**
  (brand colour rest/hover, surface base, body text, focus border, one space, one radius).
  A real internal tool would scroll the full required set; the playground trims for
  visual clarity.
- Q: vitest JSX transform? → A: **Pin `esbuild.jsx: "automatic"` in `vitest.config.ts`.**
  Without it, the example's lack of a `tsconfig.json` (only `tsconfig.typecheck.json`
  exists) makes vitest's internal esbuild fall back to the classic transform — which
  calls `React.createElement` and fails because we don't import React explicitly.
- Q: Aurora theme import path? → A: **Relative path
  (`../../mock-bank-aurora/theme/aurora.tokens.json`) with an `import attributes` JSON
  hint.** The mock-bank-aurora package only re-exports its `App`, not the theme file;
  rather than adding a package export just for the playground, a direct path import is
  the simpler dependency.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Validate the builder integration end-to-end (Priority: P1)

The playground is the canonical "is the builder working?" demonstration. Editing a colour
in the editor must reflect in the showcase with zero extra wiring.

**Independent Test**: `tests/integration.test.tsx` — render the Playground, change
`pm.color.action.primary.rest` to `#ff00aa`, assert the row marks itself changed + the
dirty indicator flips.

### User Story 2 — Confirm the preview slot contract (Priority: P1)

Every adapter that consumes a `ResolvedTheme` should work inside `renderPreview`. The
Web adapter is the easiest to demonstrate; the showcase uses its themed primitives.

**Independent Test**: assert the showcase headline (`"Account opening"`) renders inside
the playground preview slot.

### User Story 3 — Mode switching propagates (Priority: P2)

Changing the mode in the editor toolbar re-renders the preview against the new mode.

**Independent Test**: change the mode dropdown to `dark`; assert the preview surface is
still mounted (proves the renderPreview function was re-invoked).

### Edge Cases

- **No `tsconfig.json` in the example**: vitest's esbuild falls back to classic JSX
  transform → `React.createElement` runtime error. Fixed by pinning `esbuild.jsx:
  "automatic"`.
- **`renderPreview` returning a `setState` call mid-render**: React `act()` warning.
  Removed the mirror-mode-into-parent pattern.

---

## Requirements *(mandatory)*

- **FR-001**: `examples/builder-playground` MUST mount `@polymorph/builder`'s
  `ThemeEditorRoot` with the Aurora theme.
- **FR-002**: The `renderPreview` slot MUST wrap the showcase in
  `@polymorph/adapter-web`'s `ThemeProvider` and consume `resolveTheme(theme, mode)`.
- **FR-003**: The showcase MUST use only `@polymorph/adapter-web` themed primitives, so
  every visible value resolves from the working theme.
- **FR-004**: Integration test MUST assert the editor toolbar + preview surface mount,
  every exposed token id renders an editable row, a token edit marks the row changed +
  flips the dirty indicator, and a mode switch propagates.
- **FR-005**: The example MUST pass `nx run-many -t build typecheck test conformance`
  cold.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/integration.test.tsx` — 5 tests (toolbar + preview mount, showcase
  headline in preview, every exposed token id has an editable row, edit dirties +
  changes data attribute, mode switch propagates).
- **SC-002**: Workspace project count grows to **22** (was 21; +1 new example).
- **SC-003**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across the new count.
- **SC-004**: `docs/guide/builder.md` adds a "Worked example" subsection cross-linking
  to the new example; `docs/reference/packages.md` adds the example row.

---

## Assumptions

- The example matches the existing project pattern (workspace package + vitest +
  typecheck), not a Vite SPA. Lower maintenance burden, integration asserted
  programmatically.
- The Web adapter's themed primitives are the right showcase surface. The React Native
  reference SDK doesn't render in DOM tests.
- Aurora as the seed theme. Any bank theme would work; Aurora is the alphabetically
  first and already widely referenced in tests.
- A trimmed token list is more readable for a demo. The full required token set scrolls
  fine but obscures the point — a real internal tool exposes everything.
- Direct path import of the theme JSON beats adding a package export. The example is
  monorepo-internal; the relative path is stable.
- vitest config needs the `esbuild.jsx: "automatic"` pin because the example doesn't
  ship a `tsconfig.json`. Documented in the config file itself.
