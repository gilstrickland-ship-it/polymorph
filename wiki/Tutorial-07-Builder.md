# Tutorial 07 — Build a visual theme editor

**Time**: ~15 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate), a React 18+ app, a theme to edit.

`@polymorph/builder` ships headless React primitives — a state hook, typed token fields,
a lint panel, and an unstyled orchestrator. You drop them into your internal tooling and
style the rest.

---

## Install

```bash
npm install @polymorph/builder @polymorph/adapter-web
```

## The orchestrator (the 80% case)

```tsx
import { ThemeEditorRoot } from "@polymorph/builder";
import { ThemeProvider } from "@polymorph/adapter-web";
import { resolveTheme } from "@polymorph/core";
import myTheme from "./theme.tokens.json" with { type: "json" };

function ThemeAdmin() {
  return (
    <ThemeEditorRoot
      initialTheme={myTheme}
      tokenIds={[
        "pm.color.action.primary.rest",
        "pm.color.action.primary.hover",
        "pm.color.surface.base",
        "pm.color.text.body",
        "pm.space.md",
        "pm.radius.control",
      ]}
      onCommit={(updated) => api.saveTheme(updated)}
      renderPreview={({ theme, mode }) => (
        <ThemeProvider theme={resolveTheme(theme, mode)}>
          <YourComponentShowcase />
        </ThemeProvider>
      )}
    />
  );
}
```

That's the entire wiring. Every token edit re-renders the preview against the live theme;
the dirty indicator + Save button manage state; the lint panel surfaces warnings.

## Styling

Every component emits `data-pm-*` attributes — no styles are imposed. Add your own CSS:

```css
[data-pm-builder="root"] { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
[data-pm-builder="toolbar"] { /* ... */ }
[data-pm-token-list] { list-style: none; padding: 0; }
[data-pm-token-id] { padding: 8px; }
[data-pm-token-changed="true"] { background: #fff8e1; }
[data-pm-lint-code^="PROTECTED_"] { border-left: 3px solid #d33; padding-left: 8px; }
```

## The hook (when you need more control)

```tsx
import { useThemeEditor, ColorField, LintPanel } from "@polymorph/builder";

function CustomEditor({ initialTheme }) {
  const editor = useThemeEditor(initialTheme);
  const { state, setTokenValue, setMode, reset, commit, exportTheme } = editor;

  return (
    <>
      <button onClick={reset} disabled={!state.dirty}>Reset</button>
      <button
        onClick={() => { commit(); save(exportTheme()); }}
        disabled={!state.dirty || !state.validation.valid}
      >
        Save
      </button>
      <p>{state.dirty ? "● unsaved" : "✓ saved"}</p>
      <p>{state.warnings.length} lint warnings</p>

      <ColorField
        value={state.working.pm.modes.light.color.action.primary.rest.$value}
        onChange={(v) => setTokenValue("pm.color.action.primary.rest", "color", v)}
        label="Primary action"
      />

      <LintPanel
        warnings={state.warnings}
        onActivate={(w) => scrollToTokenRow(w.tokenIds[0])}
      />
    </>
  );
}
```

## State shape

```ts
state.baseline          // the theme as loaded
state.working           // the theme as currently edited
state.mode              // current mode (light / dark / highContrast)
state.dirty             // any edits vs. baseline?
state.changedTokenIds   // Set<SemanticTokenId> — every changed token
state.changedComponentPaths  // Set<string> — e.g. "button.primary.background"
state.validation        // { valid, errors } from validateTheme
state.warnings          // LintWarning[] from lintTheme(resolveTheme(working, mode))
```

## Editing component properties

```ts
editor.setComponentProperty("button.primary", "background", {
  $type: "color",
  $value: "#0050a0",
});
// Writes to pm.button.primary.background — the path the resolver reads from.
```

## Working example

The repo ships `examples/builder-playground`: a complete integration with the Web adapter
+ the Aurora bank theme. It's the canonical "is the wiring right?" demonstration.

```bash
pnpm --filter @polymorph/example-builder-playground test
```

## What's next

- [Tutorial 08 — Policy packs](Tutorial-08-Policy-Packs) for FI-specific lint rules to surface in the panel
- [Tutorial 10 — Protected surfaces](Tutorial-10-Protected-Surfaces) for stricter floors on regulator copy
