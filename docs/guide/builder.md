# Interactive theme builder

`@polymorph/builder` ships **headless React primitives** for editing a theme contract with
live validation + lint + preview. The package gives a design-system team the building
blocks for a visual theme editor; visual chrome is the FI's job.

The surface is small on purpose:

| Export | Purpose |
|---|---|
| `useThemeEditor(initial, mode?)` | The headless state hook — owns the working theme, tracks dirtiness, computes lint on every edit. |
| `ColorField` / `DimensionField` / `DurationField` / `NumberField` / `CubicBezierField` | Typed primitive editors with stable `data-pm-field="*"` hooks for CSS. |
| `TokenField` | Dispatcher — picks the right primitive given a token's `$type`. |
| `LintPanel` | Renders `LintWarning[]` as an accessible list with `aria-live="polite"` and `data-pm-lint-code="*"` per row. |
| `ThemeEditorRoot` | Unstyled orchestrator combining all of the above for the 80% case. |

## The hook

```tsx
import { useThemeEditor } from "@polymorph/builder";

function MyEditor({ initialTheme }) {
  const editor = useThemeEditor(initialTheme);
  const { state, setTokenValue, reset, commit } = editor;

  return (
    <>
      <button onClick={reset} disabled={!state.dirty}>Reset</button>
      <button
        onClick={() => { commit(); save(editor.exportTheme()); }}
        disabled={!state.dirty || !state.validation.valid}
      >
        Save
      </button>
      <p>{state.dirty ? "● unsaved" : "✓ saved"}</p>
      <p>{state.warnings.length} lint warnings</p>
    </>
  );
}
```

`state` carries:

| Field | What it is |
|---|---|
| `baseline` / `working` | The theme as initially loaded vs. as currently edited. |
| `mode` | The mode `lintTheme` + `resolveTheme` run against. |
| `dirty` | `true` iff any token value differs from baseline. |
| `changedTokenIds` | `Set<SemanticTokenId>` — every token whose authored value differs. |
| `changedComponentPaths` | `Set<string>` — every `${role}.${property}` whose component override differs (e.g. `"button.primary.background"`). Distinct from token ids because role/property paths aren't `SemanticTokenId`s. |
| `validation` | `{ valid, errors }` from `validateTheme`. |
| `warnings` | `LintWarning[]` from `lintTheme(resolveTheme(working, mode))`. Empty when validation fails. |

`actions`:

| Action | Effect |
|---|---|
| `setTokenValue(id, $type, value)` | Write the authored value. Mode-sensitive ids land under `pm.modes.<mode>`; mode-invariant ids land under `pm.*` — the hook detects which by probing the baseline structure. |
| `setComponentProperty(role, property, value)` | Set a component-role override. Writes under `pm.<role>.<property>` (the path the resolver reads from), so `resolveTheme` picks it up on the next render. |
| `setMode(mode)` | Switch the preview / lint mode. |
| `reset()` | Revert every edit. |
| `commit()` | Snapshot working as the new baseline. |
| `loadTheme(theme)` | Replace both baseline + working. |
| `exportTheme()` | Get a JSON-cloned snapshot, ready to download / submit. |

## Token fields

Every field accepts `{ value, onChange, label?, id?, disabled? }`. They emit unstyled
markup with a stable `data-pm-field="<type>"` attribute and accessible labels. Style them
however your design system wants.

```tsx
import { ColorField, DimensionField } from "@polymorph/builder";

<ColorField value="#1f5cff" onChange={setBrand} label="Brand" />
<DimensionField value={{ value: 8, unit: "px" }} onChange={setSpace} label="Space" />
```

`TokenField` dispatches to the right primitive given a token's `$type`:

```tsx
<TokenField $type="color" value={value} onChange={onChange} label={id} />
```

Returns `null` for token types not yet edited visually (`typography`, `shadow`). Callers
who need them ship their own composite editor and slot it in.

## Lint panel

```tsx
import { LintPanel } from "@polymorph/builder";

<LintPanel
  warnings={state.warnings}
  highlightedTokenId={focusedToken}
  onActivate={(w) => scrollToToken(w.tokenIds[0])}
/>
```

`aria-live="polite"` so screen readers announce new warnings as edits land. Each row
carries `data-pm-lint-code` for per-code styling and `data-pm-highlighted-token` for the
focused-token case.

## Orchestrator

`ThemeEditorRoot` is the 80% case — a thin combinator of the hook + a token list + the
lint panel:

```tsx
import { ThemeEditorRoot } from "@polymorph/builder";
import { ThemeProvider } from "@polymorph/adapter-web";

<ThemeEditorRoot
  initialTheme={aurora}
  tokenIds={["pm.color.surface.base", "pm.color.action.primary.rest"]}
  onCommit={(theme) => api.saveTheme(theme)}
  renderPreview={({ theme, mode }) => (
    <ThemeProvider theme={theme} mode={mode}>
      <YourComponentShowcase />
    </ThemeProvider>
  )}
/>
```

The preview slot is the connection to the rest of the SDK — every adapter that consumes a
`ResolvedTheme` works. Pass the working theme to `ThemeProvider` (web) /
`PolymorphProvider` (Vue / Solid / Angular) / the native runtime, and the showcase
re-renders on every edit.

For sophisticated UIs (drag-drop reordering, multi-section grouping, search), skip
`ThemeEditorRoot` and compose the hook + fields + panel directly.

## Worked example

`examples/builder-playground` ships a complete composition: `<ThemeEditorRoot>` against
Aurora's theme + a `renderPreview` slot that mounts `<ThemeProvider>` + a small showcase
built from the Web adapter's themed primitives (`<Card>`, `<Field>`, `<PrimaryButton>`,
`<StepIndicator>`). It's the end-to-end "is the wiring right?" canary — when a token edit
in the editor lands, the showcase re-renders against the working theme with no extra
plumbing.

The integration test (`tests/integration.test.tsx`) asserts the editor toolbar mounts,
the showcase renders inside the preview slot, every exposed token id appears as an
editable row, editing a token marks the row changed + flips the dirty indicator, and
switching modes propagates through. Same pattern as the existing mock-bank tests — a
single workspace package, typechecked + tested, no Vite SPA needed.

## What it doesn't ship

- **Visual chrome / theming for the builder UI itself.** Every component emits accessible
  unstyled markup with `data-pm-*` hooks; the FI styles to match their tooling.
- **Persistence.** `exportTheme()` returns a JSON snapshot; how it reaches a backend is
  the host's concern.
- **Composite-token visual editors (typography, shadow).** `TokenField` returns `null` for
  those. Build a custom composite field and slot it in when needed.
- **Undo / redo stack.** `reset()` reverts to baseline; `commit()` advances the baseline.
  A multi-step undo belongs in product code, not the contract editor.
- **Primitive-group editing (`color.brand.*`, etc.).** That's a design-token tool's job —
  the contract editor scopes to `pm.*` ids + component roles.
