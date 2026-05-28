# Contract: ResolvedTheme (neutral output)

The single structure SDKs and adapters consume. Produced by the resolver (Spec B) for **one
selected mode**; its **shape is fixed here** (Constitution Principle IV — framework- and
component-model-neutral, so any SDK, new or retrofit, can read it).

## Shape

```ts
type SemanticTokenId = string; // e.g. "pm.color.action.primary.rest"

interface ResolvedToken {
  $type: "color" | "dimension" | "typography" | "shadow" | "duration" | "cubicBezier" | "number";
  value: unknown;            // concrete value (no aliases), per $type (see below)
}

interface ResolvedTheme {
  contractVersion: string;                       // semver the theme/SDK target
  mode: "light" | "dark" | "highContrast";       // the resolved mode
  tokens: Record<SemanticTokenId, ResolvedToken>;// every required token present; ids are pm.* only
  components: Record<string, Record<string, unknown>>; // role -> property -> resolved value
}
```

## Concrete value shapes (post-resolution)

| `$type` | `value` |
|---|---|
| `color` | CSS Color 4 string (hex / `color()` / `oklch()` …) |
| `dimension` | `{ value: number, unit: "px" \| "rem" }` |
| `typography` | `{ fontFamily, fontWeight, fontSize: dimension, lineHeight, letterSpacing }` |
| `shadow` | shadow object, or array of shadow objects |
| `duration` | `{ value: number, unit: "ms" \| "s" }` |
| `cubicBezier` | `[number, number, number, number]` |
| `number` | `number` |

## Invariants

- **No aliases** — every `{...}` reference resolved to a concrete value.
- **No primitives** — keys are exclusively `pm.*` semantic ids; FI primitive ids never appear.
- **No cycles** — guaranteed by the resolver's cycle check.
- **Completeness** — all `required` tokens for `mode` present; optional tokens present only if the
  theme defined them.
- **Component fallback applied** — `components[role][property]` reflects the override if the theme
  set one, else the value of its `defaultsFrom` semantic token.

## Why neutral (retrofit enablement — FR-018-020)

`ResolvedTheme` is a plain data object: no React/Flutter/SwiftUI types, no styling-library
coupling, no SDK component classes. A **new** SDK reads `tokens`/`components` directly; an
**existing** SDK is retrofitted by a thin per-platform shim (Spec C) that maps these values onto
the SDK's existing theme object / style API — without the SDK adopting Polymorph's component set.
