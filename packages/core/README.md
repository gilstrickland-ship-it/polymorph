# @polymorph/core

The runtime **resolution core** (TypeScript, RN-safe — no Node-only APIs) shared by web and
React Native adapters. Operates purely on `@polymorph/spec` ids and emits the neutral
`ResolvedTheme`.

```ts
import { validateTheme, resolveTheme, lintTheme } from "@polymorph/core";

const r = validateTheme(themeJson);          // JSON Schema + graph checks (dangling alias, cycle)
if (r.valid) {
  const rt = resolveTheme(themeJson, "dark"); // aliases resolved, mode selected, components filled
  const warnings = lintTheme(rt);             // advisory WCAG 2.1 — never throws, never blocks
}
```

| Export | Purpose |
|---|---|
| `validateTheme(theme)` → `ValidationResult` | Ajv 2020 schema validation + `ALIAS_UNRESOLVED` / `ALIAS_CYCLE` graph checks; located errors. Never throws. |
| `resolveTheme(theme, mode?)` → `ResolvedTheme` | Transitive alias resolution, mode selection (default `light`), component `defaultsFrom` fallback. |
| `declaredModes(theme)` | Modes the theme declares. |
| `lintTheme(resolved)` → `LintWarning[]` | Advisory: WCAG 2.1 contrast, touch-target, disabled-opacity. |
| `contrastRatio(a, b)` | Pure WCAG 2.1 ratio (sRGB hex / `rgb()`). |

> Implemented in **Spec B — Core + Loaders**.
