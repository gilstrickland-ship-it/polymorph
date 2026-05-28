# Figma Variables import

`@polymorph/authoring`'s `importFigmaVariables` accepts a Figma REST API
[Variables response](https://www.figma.com/developers/api#variables) and converts it to a
Polymorph-shaped DTCG theme. Use this when your design tokens live in Figma Variables — the
native variables surface — rather than Tokens Studio.

## Quick conversion

```ts
import { importFigmaVariables, type FigmaMapping } from "@polymorph/authoring";

// Fetched from GET /v1/files/:fileKey/variables/local
const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/variables/local`, {
  headers: { "X-Figma-Token": process.env.FIGMA_TOKEN! },
}).then((r) => r.json());

const mapping: FigmaMapping = {
  collection: "Polymorph",         // optional: restrict to one collection
  ids: {
    "pm.color.surface.base":         "color/surface/base",
    "pm.color.text.body":            "color/text/body",
    "pm.color.action.primary.rest":  "color/action/primary/rest",
    "pm.space.md":                   "space/md",
    "pm.radius.control":             "radius/control",
    "pm.motion.duration.base":       "motion/duration/base",
    "pm.opacity.disabled":           "opacity/disabled",
    // ...
  },
  modes: {
    light: "Light",
    dark:  "Dark",
  },
};

const { theme, report } = importFigmaVariables(response, mapping);
// theme is a DTCG theme; validate / resolve / transform like any other
```

The mapping is **explicit by design** — Polymorph won't guess which Figma variable matches
which contract token. The importer reports missing or unconvertible ids back to you.

## What gets mapped

| Figma `resolvedType` | Polymorph `$type` it can populate |
|---|---|
| `COLOR` (`{ r, g, b, a }` 0…1) | `color` (→ `#rrggbb`, or `#rrggbbaa` if alpha < 1) |
| `FLOAT` | `dimension` (→ `{ value, unit: "px" }`), `number`, `duration` (→ `{ value, unit: "ms" }`) |
| `STRING` / `BOOLEAN` | — not currently routed; report as `unconvertible` |

The Figma Variables API doesn't carry composites — **typography**, **shadow**, and
**cubicBezier** can't be imported through this path. Author those tokens by hand (or via
Tokens Studio); only color / dimension / number / duration flow through here.

## Aliases

Figma Variables can reference other variables (`{ type: "VARIABLE_ALIAS", id: "..." }`). The
importer resolves alias chains eagerly to a concrete value at each Polymorph mode — matching
the Tokens Studio importer's behaviour and producing a clean DTCG theme with no aliases left
to resolve.

Alias cycles and dangling references throw with a clear error message.

## Modes

Each Figma `VariableCollection` has its own list of modes. The mapping picks one collection
(or the first encountered) and maps Polymorph mode names → Figma mode names:

```ts
modes: { light: "Light", dark: "Dark", highContrast: "High Contrast" }
```

Mode-sensitive Polymorph tokens emit per-mode under `pm.modes.<mode>.*` in the resulting
theme; mode-invariant tokens use the collection's default mode and land directly under `pm.*`.

## What it doesn't do

- **Round-trip**: the importer is one-way (Figma → Polymorph). Round-tripping is out of scope;
  the canonical source after import is the Polymorph JSON.
- **Auto-discovery**: the importer won't guess id mappings. If your variable naming follows a
  predictable convention you can build the `mapping.ids` programmatically — but that's your
  code, not the importer's.
- **Text Styles / Effect Styles**: those Figma surfaces are separate REST endpoints
  (`/v1/files/:key/styles`). Tokens Studio writes them into its own JSON and the Tokens Studio
  importer handles them.

## When to use this vs. Tokens Studio

| Use this if… | Use Tokens Studio if… |
|---|---|
| Your design system lives in Figma Variables (the native feature). | Your design system lives in the Tokens Studio plugin. |
| You only need color / dimension / number / duration tokens. | You need typography, shadow, or cubicBezier. |
| You have a clean Figma-as-source-of-truth posture. | You have an established Tokens Studio workflow. |

Both paths converge on the same DTCG theme shape, so the rest of the pipeline (validate, lint,
resolve, transform) is identical.
