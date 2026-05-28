# Feature Specification: Interactive Theme Builder

**Spec ID**: 024-interactive-builder

**Created**: 2026-05-28

**Status**: Implemented

**Input**: Every FI rollout asked the same question late in their onboarding: "Is there a
visual editor we can drop into our internal tooling?" The contract + importers + lint are
machine-shaped; design-system teams need a UI surface that lets a human edit tokens, see
contrast warnings live, and preview against a real SDK. This spec adds the package.

---

## Overview

New package: `@polymorph/builder`. Headless React primitives — a state hook that owns the
working theme + tracks dirtiness + computes lint on every edit, a set of typed token field
components, an accessible lint panel, and an unstyled orchestrator combining them. Every
component emits stable `data-pm-*` hooks so the FI styles them to match their existing
tooling.

| Surface | Purpose |
|---|---|
| `useThemeEditor(initial, mode?)` | The state hook. Returns `{state, setTokenValue, setComponentProperty, setMode, reset, commit, loadTheme, exportTheme}`. |
| `ColorField`, `DimensionField`, `DurationField`, `NumberField`, `CubicBezierField` | Typed primitive editors. |
| `TokenField` | Dispatcher that picks the right primitive given `$type`. Returns `null` for `typography` / `shadow` (composite types ship later). |
| `LintPanel` | Accessible warning list with `aria-live="polite"`. |
| `ThemeEditorRoot` | Unstyled orchestrator combining the above for the 80% case. |

Composes with the existing SDK: hosts pass the working theme to any adapter
(`ThemeProvider` for web; `PolymorphProvider` for Vue / Solid / Angular; the native
runtime) inside `renderPreview` to get a live preview against real components.

---

## Clarifications

### Session 2026-05-28

- Q: Headless hook + components, or one all-in-one editor? → A: **Both.** The hook is the
  primary surface (sophisticated UIs need it); `ThemeEditorRoot` is a thin combinator for
  the 80% case. Skipping the orchestrator and going hook-only is a supported path.
- Q: Mode-sensitive write target? → A: **Probe baseline structure.** Mode-sensitive ids
  live at `pm.modes.<mode>.<id>`; mode-invariant ids live at `pm.*`. The hook detects which
  by checking if the same id exists under the mode path in the baseline. Avoids importing
  TOKENS metadata in the hook (which would force a contract-version rebuild on every
  consumer).
- Q: Visual chrome? → A: **None.** Every component emits unstyled accessible markup with
  `data-pm-*` attributes. Visual styling is the FI's job — it must match their existing
  tooling, and any opinion we ship is wrong for someone.
- Q: Composite-type editors (typography / shadow)? → A: **Out of scope for v1.**
  `TokenField` returns `null` for those types. FIs that need them ship custom field
  components and slot them in. Shipping a typography editor means picking a font-family
  picker UI, which is out of scope for the contract.
- Q: Preview surface? → A: **Caller-rendered.** `ThemeEditorRoot` takes
  `renderPreview({theme, mode})` which the host fills with `ThemeProvider` + their
  showcase. Decouples the builder from the adapter the FI uses.
- Q: Undo / redo stack? → A: **Out of scope.** `reset()` reverts to baseline; `commit()`
  advances it. Multi-step undo belongs in product code, not the contract editor.
- Q: Lint recomputation? → A: **On every render via useMemo.** Cheap relative to the work
  a human does between edits; nothing fancy needed.
- Q: Persistence? → A: **Caller's job.** `exportTheme()` returns a JSON-cloned snapshot
  ready to download / submit; the builder doesn't ship file I/O or network code.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Design-system team builds a theme editor inside their tooling (Priority: P1)

The FI's internal tooling team imports `useThemeEditor` + the typed field components and
composes a UI matching their existing chrome. Edits flow into the working theme; lint
warnings surface inline; save commits to the FI's backend.

**Independent Test**: `tests/use-theme-editor.test.tsx` — hook lifecycle: start clean,
edit dirties, mode-sensitive vs invariant write paths, reset / commit / loadTheme /
exportTheme.

### User Story 2 — Live preview against the reference SDK (Priority: P1)

The host passes the working theme to `ThemeProvider` inside `ThemeEditorRoot`'s
`renderPreview` slot. Component showcase re-renders on every edit.

**Independent Test**: `tests/theme-editor-root.test.tsx` — preview slot receives the
working theme + mode; mode-dropdown change propagates to the preview.

### User Story 3 — Lint surfacing as edits land (Priority: P1)

Shrinking `pm.size.touchTarget.min` below 44px adds `TOUCH_TARGET_SMALL` to
`state.warnings` immediately. The lint panel announces the change via `aria-live`.

**Independent Test**: `tests/use-theme-editor.test.tsx` — TOUCH_TARGET_SMALL fires when
the touch target shrinks; `tests/lint-panel.test.tsx` — panel renders warnings,
highlights tokens, triggers `onActivate`.

### User Story 4 — Schema-invalid edits block save (Priority: P1)

Writing a structurally invalid value (a `number` where the schema demands
`{value, unit}`) flips `state.validation.valid` false. `ThemeEditorRoot`'s Save button
disables.

**Independent Test**: `tests/use-theme-editor.test.tsx` — schema-invalid dimension flips
validation false.

### Edge Cases

- **Mode-invariant edit writes to `pm.*` directly** — verified by structural assertion.
- **Mode-sensitive edit writes to `pm.modes.<mode>` only** — light-mode edit leaves
  dark-mode value untouched.
- **`exportTheme()` returns a clone** — mutations to the working theme after export don't
  leak into the snapshot.
- **`TokenField` for unsupported $type returns null** — typography / shadow.

---

## Requirements *(mandatory)*

- **FR-001**: `useThemeEditor(initial, mode?)` MUST return `{state, setTokenValue,
  setComponentProperty, setMode, reset, commit, loadTheme, exportTheme}`.
- **FR-002**: `state` MUST include `baseline`, `working`, `mode`, `dirty`,
  `changedTokenIds`, `validation`, `warnings`.
- **FR-003**: `setTokenValue` MUST write mode-sensitive ids under `pm.modes.<mode>` and
  mode-invariant ids under `pm.*` — detected by probing baseline structure.
- **FR-004**: `dirty` MUST be a derived from `changedTokenIds.size > 0`, NOT a separate
  flag.
- **FR-005**: `state.warnings` MUST be recomputed on every render (cheap; let
  `useMemo` cache by reference equality).
- **FR-006**: Every field component MUST emit `data-pm-field="<type>"` and accept
  `{value, onChange, label?, id?, disabled?}`.
- **FR-007**: `LintPanel` MUST set `aria-live="polite"` and emit `data-pm-lint-code` per
  row.
- **FR-008**: `ThemeEditorRoot` MUST take optional `renderPreview({theme, mode})` and
  optional `onCommit(theme)`; SAVE button MUST disable when `!dirty || !valid`.
- **FR-009**: `TokenField` MUST dispatch on `$type` to the right primitive; MUST return
  `null` for `typography` / `shadow`.
- **FR-010**: Tests MUST run under happy-dom with vitest `globals: true` so React Testing
  Library's auto-cleanup registers.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/use-theme-editor.test.tsx` — 10 tests covering the hook lifecycle.
- **SC-002**: `tests/fields.test.tsx` — 10 tests covering each typed field + the
  dispatcher.
- **SC-003**: `tests/lint-panel.test.tsx` — 5 tests covering rendering, highlighting,
  activation.
- **SC-004**: `tests/theme-editor-root.test.tsx` — 6 tests covering the orchestrator.
- **SC-005**: `packages/builder` total **31 tests**.
- **SC-006**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across **21 projects** (was 20; +1 new package).
- **SC-007**: New docs page `/guide/builder` shipped; reference/packages updated; sidebar
  entry added.

---

## Assumptions

- React 18+ is the FI's runtime. We don't ship Vue / Solid / Angular bindings of the
  builder — those FIs build their own state machine around the same `validateTheme` /
  `lintTheme` core (a thin port; happy to add if FIs ask).
- Hosts wire the preview via the existing adapter's ThemeProvider (`@polymorph/adapter-web`
  for React; `@polymorph/adapter-web-vue` / etc. for other frameworks). The builder
  doesn't import any adapter directly — keeps the package framework-light.
- Visual styling is the FI's job. We ship accessible unstyled markup with stable
  `data-pm-*` hooks; the FI's CSS does the rest.
- `useReducer` is the right state primitive — simpler than `useState`-per-field, no
  external state library, no context needed.
- Schema-invalid edits surface in `state.validation.valid` but don't throw. The Save
  button reads `validation.valid` and disables; the editor still lets the user keep
  editing past an invalid state to fix it.
- Cleanup between React Testing Library renders requires vitest `globals: true` — without
  it, rendered nodes pile up in the JSDOM container and lookups like
  `screen.getByText("Save")` match every save button ever rendered. This is documented in
  the vitest config.
