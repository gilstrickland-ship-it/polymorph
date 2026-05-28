# Tokens Studio import

`@polymorph/authoring` accepts Tokens Studio's two export shapes — **single-file consolidated**
and **multi-file** — and converts them to a Polymorph-shaped DTCG theme that
`validateTheme` accepts.

## Quick conversion

```ts
import { importTokensStudio } from "@polymorph/authoring";
import single from "./tokens-studio-export.json";

const polymorph = importTokensStudio(single, {
  mapping: {
    // map Tokens Studio paths → pm.* ids
    "global.color.brand.500": "pm.color.action.primary.rest",
    "global.color.text.body": "pm.color.text.body",
    // ...
  },
});

// polymorph is a DTCG theme; validate / resolve / transform like any other
```

The mapping is **explicit by design**. Different orgs structure their Tokens Studio sets
differently; Polymorph won't guess. The importer fails loud if a required `pm.*` token isn't
covered by the mapping.

## Multi-file exports

Tokens Studio's multi-file export drops one JSON per token set. The importer takes the
**directory**:

```ts
import { importTokensStudioMultiFile } from "@polymorph/authoring";

const polymorph = importTokensStudioMultiFile("./tokens-studio-export/", {
  mapping: { /* same shape */ },
  modes: {
    // which file represents which mode
    light: "themes/light.json",
    dark:  "themes/dark.json",
  },
});
```

## What gets mapped

| Tokens Studio type | Polymorph `$type` |
|---|---|
| `color` (any CSS Color 4 form) | `color` |
| `dimension`, `sizing`, `spacing`, `borderRadius` | `dimension` |
| `fontFamilies` / `fontWeights` / `fontSizes` / `lineHeights` / `letterSpacing` (typography composite) | `typography` |
| `boxShadow` (single or array) | `shadow` |
| `cubicBezier` | `cubicBezier` |
| `duration` | `duration` |
| `opacity`, `number` | `number` |

Unknown types are skipped with a diagnostic. Aliases (`{global.color.brand.500}`) are kept as
aliases — the importer doesn't resolve them; that's `resolveTheme`'s job.

## When to author DTCG directly instead

If your design tokens already live as DTCG JSON outside Tokens Studio, skip the importer. The
contract is DTCG; you can write it by hand or generate from your existing pipeline.

## A non-goal

The importer is **not** a bidirectional sync. Output flows Tokens Studio → Polymorph only.
Round-tripping is out of scope; the canonical source after import is the Polymorph JSON.
