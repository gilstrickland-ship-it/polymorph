# Figma Text & Effect Styles import

`@polymorph/authoring`'s `importFigmaStyles` converts an FI's Figma Text Styles + Effect
Styles into the **typography** and **shadow** slots of a Polymorph theme. Use this alongside
`importFigmaVariables` when your design system lives entirely in Figma — Variables for
color / dimension / number / duration, Styles for typography + shadows.

## Quick conversion

```ts
import { importFigmaStyles, type FigmaStylesMapping } from "@polymorph/authoring";

const input = {
  textStyles: {
    "Heading / H1": {
      fontFamily: "Inter",
      fontWeight: 600,
      fontSize: 24,
      lineHeightPx: 32,
      letterSpacing: 0,
    },
    "Body / Default": {
      fontFamily: "Inter",
      fontWeight: 400,
      fontSize: 16,
      lineHeightPercent: 140,
    },
    // ...
  },
  effectStyles: {
    "Elevation / Raised": [
      { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 1 }, radius: 2 },
      { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.04 }, offset: { x: 0, y: 2 }, radius: 4 },
    ],
    // ...
  },
};

const mapping: FigmaStylesMapping = {
  textStyles: {
    "pm.typography.heading":     "Heading / H1",
    "pm.typography.body":        "Body / Default",
    // ...
  },
  effectStyles: {
    "pm.elevation.raised":  "Elevation / Raised",
    "pm.elevation.overlay": "Elevation / Overlay",
  },
};

const { theme, report } = importFigmaStyles(input, mapping);
```

The mapping is **explicit** — Polymorph won't guess which Figma style matches which contract
token. The importer reports missing or unconvertible ids back.

## Why a curated input shape, not the raw Figma API?

Figma's REST API returns Text + Effect Style metadata via
`GET /v1/files/:key/styles`, then requires a follow-up `GET /v1/files/:key/nodes?ids=…` to
extract the actual `style` block per node. Most orgs already have tooling that does this
flatten — so the importer accepts the **already-flattened** shape (`{ textStyles: {…},
effectStyles: {…} }`) rather than coupling to the full REST node graph.

A reference fetcher (≈ 30 lines of TypeScript) is documented inline in the package's source
header; we don't ship it as a hard dependency because every org's auth / rate-limit posture
differs.

## What gets mapped

### Text styles → typography

| Figma field | Polymorph `typography` sub-field |
|---|---|
| `fontFamily` | `fontFamily` |
| `fontWeight` | `fontWeight` |
| `fontSize` | `fontSize: { value, unit: "px" }` |
| `lineHeightPx` (preferred) | `lineHeight: lineHeightPx / fontSize` (multiplier) |
| `lineHeightPercent` | `lineHeight: percent / 100` |
| `letterSpacing` | `letterSpacing: { value, unit: "px" }` |

If neither `lineHeightPx` nor `lineHeightPercent` is set, the importer defaults to `1.4` —
the de-facto value across the contract's bank fixtures.

### Effect styles → shadow

| Figma `type` | Treatment |
|---|---|
| `DROP_SHADOW` | Standard shadow; `color` → hex, `offset.x/y` → `offsetX/Y`, `radius` → `blur`, `spread` → `spread` |
| `INNER_SHADOW` | Same, plus `inset: true` |
| `LAYER_BLUR` | Dropped silently — not representable in the contract |
| `BACKGROUND_BLUR` | Dropped silently — not representable in the contract |

Effects with `visible: false` are ignored. Multi-effect styles emit as an array of shadows;
single-effect styles emit as one shadow object.

Shadows are **mode-sensitive** in the contract (`pm.elevation.*`). The importer emits under
`pm.modes.<mode>.*`; `mapping.mode` defaults to `"light"`. Orgs with mode-specific shadow
intensity run a second import with `mode: "dark"` and merge.

Typography is **mode-invariant** — it emits under `pm.*` directly regardless of `mapping.mode`.

## Composing with the Variables importer

The two importers fill **disjoint slices** of the theme. A typical Figma-as-source-of-truth
pipeline:

```ts
import {
  importFigmaVariables,
  importFigmaStyles,
} from "@polymorph/authoring";

const fromVars   = importFigmaVariables(variablesResponse, varsMapping);   // colors / dims / numbers / durations
const fromStyles = importFigmaStyles(stylesInput, stylesMapping);          // typography / shadows

// Shallow-merge the `pm` blocks; or pass both through a small deep-merge utility.
const theme = {
  contractVersion: "0.0.0",
  pm: { ...fromVars.theme.pm, ...fromStyles.theme.pm },
};

// Then validate / lint / resolve / transform as normal.
```

The same merge pattern works with the Tokens Studio importer — slot in whichever sources own
which slice of your design system.

## When to use this vs. Tokens Studio

| Use this if… | Use Tokens Studio if… |
|---|---|
| Your typography + effect styles live in native Figma Styles. | They live in the Tokens Studio plugin. |
| You already pair it with the Figma Variables importer. | You use Tokens Studio for everything. |
| You want one path to a Figma-native authoring posture. | You have an established Tokens Studio workflow. |

Both paths converge on the same DTCG theme shape, so the rest of the pipeline (validate,
lint, resolve, transform) is identical.

## What it doesn't do

- **Round-trip**: one-way (Figma → Polymorph). The canonical source after import is the
  Polymorph JSON.
- **Auto-discovery**: the importer won't guess id mappings. Build `mapping.textStyles` and
  `mapping.effectStyles` programmatically from your style-name conventions if you can —
  that's your code, not the importer's.
- **Figma Variables**: typography metrics that live in Variables (rare; Figma's design intent
  is Styles for typography) — those flow through `importFigmaVariables`.
- **Color styles** (`FILL` type): use Figma Variables for colors. Color styles are a legacy
  surface; the importer doesn't read them.
