# Contract reference

The authoritative source of the contract is the manifest at
[`packages/spec/manifest/semantic-vocabulary.v0.json`](https://github.com/gilstrickland-ship-it/polymorph/blob/main/packages/spec/manifest/semantic-vocabulary.v0.json).
The TypeScript types, JSON schema, and the importer's mapping shape are all generated from it
— the manifest is the single source of truth.

## Top-level file shape

```jsonc
{
  "$schema": "https://polymorph.dev/schemas/theme.schema.json",
  "contractVersion": "0.0.0",
  "tokens": {
    "pm.color.surface.base": { "$type": "color", "value": "#ffffff" },
    "pm.space.md": { "$type": "dimension", "value": { "value": 16, "unit": "px" } },
    // ...
  },
  "components": {
    "button.primary": {
      "background": { "$type": "color", "value": "{pm.color.action.primary.rest}" },
      "radius":     { "$type": "dimension", "value": "{pm.radius.control}" }
    }
  }
}
```

### `contractVersion`

A semver string identifying the vocabulary the theme targets. The loader fails with a clear
error on major mismatch with the SDK.

### `tokens`

A map keyed by `pm.*` token id; every required semantic token must be present. Each entry
declares its `$type` (matching the manifest) and a `value` that may be:

- A concrete literal (`"#ffffff"`, `{ value: 16, unit: "px" }`, `[0.4, 0, 0.2, 1]`, …).
- A DTCG alias string `"{some.other.id}"` — resolved by `resolveTheme`.
- A `{ "modes": { … } }` map carrying per-mode values.

### `components`

Optional. Keyed by **role** (`button.primary`, `input`, `stepIndicator`, …). Each role maps to
a per-property object; properties default from the manifest's `defaultsFrom` semantic token if
omitted.

## DTCG types

| `$type` | Concrete value shape |
|---|---|
| `color` | Any CSS Color 4 form: `#hex` / `rgb()` / `hsl()` / `oklch()` / `oklab()` / `color(display-p3 …)`. |
| `dimension` | `{ value: number, unit: "px" \| "rem" }`. |
| `number` | A plain number (opacity, line-height multiplier, etc.). |
| `duration` | `{ value: number, unit: "ms" \| "s" }`. |
| `cubicBezier` | `[x1, y1, x2, y2]` — four numbers. |
| `typography` | Composite: `{ fontFamily, fontWeight, fontSize, lineHeight, letterSpacing }`. |
| `shadow` | Single object or array of `{ color, offsetX, offsetY, blur, spread, inset? }`. |

Aliases (`"{pm.color.action.primary.rest}"`) are valid for any type — resolution preserves
the destination type.

## Modes shape

```json
{
  "$type": "color",
  "value": {
    "modes": {
      "light": "#0a1418",
      "dark":  "#f4f7ff",
      "highContrast": "#000000"
    }
  }
}
```

`resolveTheme(theme, "dark")` picks the `dark` arm. Missing modes fall back to `light` by
convention; if `light` is also missing the validator errors.

## `ResolvedTheme`

The contract after resolution:

```ts
interface ResolvedTheme {
  mode: ThemeMode;
  contractVersion: string;
  tokens: Record<SemanticTokenId, ResolvedTokenNode>;
  components: Record<ComponentRole, Record<string, unknown>>;
}
```

Every semantic token has a concrete value (no aliases left). Every component property is
filled in (override or resolved default). Adapters consume this shape and nothing else.

## Versioning rules

- **Adding tokens or component roles** → minor bump. Existing themes remain valid.
- **Renaming or removing tokens** → major bump. Themes and SDKs must reissue.
- **Changing the type of an existing token** → major bump.
- **Loosening validation** (e.g. accepting a new CSS Color 4 form) → minor bump.
- **Tightening validation** → major bump.

The manifest's `version` field is the source of truth for the current contract version.
