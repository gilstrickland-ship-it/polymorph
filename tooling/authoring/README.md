# @polymorph/authoring

The theme **authoring pipeline** — closing the loop between an FI's existing design system and a
valid Polymorph theme.

## What ships today

**Tokens Studio import (single-file consolidated export).** Take an FI's Tokens Studio JSON plus
a `MappingConfig` (Polymorph semantic id → Tokens Studio dotted path) and produce a Polymorph
theme that `@polymorph/core.validateTheme` accepts.

```ts
import { importTokensStudio, lintMapping } from "@polymorph/authoring";
import { validateTheme } from "@polymorph/core";

const errors = lintMapping(mapping);            // sanity check
if (errors.length) throw new Error(errors.join("\n"));

const { theme, report } = importTokensStudio(tokensStudioExport, mapping);
// report: { imported: SemanticTokenId[]; missing: …; unconvertible: … }

validateTheme(theme).valid;                     // → true for a complete mapping
```

### What the importer handles

- **Sets & themes** — merges enabled Tokens Studio sets in `MappingConfig` order (later overrides
  earlier), matching TS's stacking semantics.
- **Aliases** — `{path.to.token}` references inside Tokens Studio values are resolved against the
  merged registry; dangling references and cycles throw.
- **Type conversion** — Tokens Studio's unprefixed `value`/`type` → DTCG `$value`/`$type` with
  per-type normalization:
  - `color` → `color`
  - `spacing` / `sizing` / `borderRadius` / `borderWidth` / `dimension` → DTCG `dimension`
    `{value, unit}` (parses `"16"`, `"16px"`, `"1.5rem"`, and bare numbers; defaults to `px`)
  - `opacity` → DTCG `number` (handles `"50%"`)
  - `typography` → DTCG `typography` composite (fontWeight strings like `"SemiBold"` → 600;
    `lineHeight: "150%"` → 1.5; `"AUTO"` → 1.2)
  - `boxShadow` → DTCG `shadow` (single or array; `innerShadow` becomes `inset: true`)
  - `duration` (number or `"200ms"` / `"0.2s"`) and `cubicBezier` (4-tuple) pass through

### Mapping shape

```ts
interface MappingConfig {
  invariant: { sets: string[]; ids: Partial<Record<SemanticTokenId, string>> };
  modes: Partial<Record<ThemeMode, { sets: string[]; ids: Partial<Record<SemanticTokenId, string>> }>>;
}
```

A small `lintMapping` helper rejects misplaced ids (mode-sensitive listed under `invariant`, etc.).

### Multi-file Tokens Studio exports

```ts
import { loadTokensStudioFromDirectory, consolidateTokensStudioFiles, importTokensStudio } from "@polymorph/authoring";

// File-based (Node): a directory of `<set>.json` files plus `$themes.json` / `$metadata.json`.
const exportObj = await loadTokensStudioFromDirectory("./my-bank-tokens");
const { theme } = importTokensStudio(exportObj, mapping);

// Or pure (no fs): pass an in-memory map of filename → parsed JSON.
const consolidated = consolidateTokensStudioFiles({
  "global.json": globalJson,
  "$themes.json": themesJson,
  "$metadata.json": metaJson,
});
```

The consolidator routes `$themes.json` / `$metadata.json` into their special slots and treats
every other `*.json` as a token set named after the file. The result feeds the same
`importTokensStudio` API — single-file and multi-file paths share one importer.

### Out of scope (deferred)

- **Figma direct import**, **auto-extract from a live app**, and the **interactive theme builder**
  — separate cycles per the roadmap.

> Tokens Studio import (single-file): **Spec G**. Multi-file support: **Spec H**.
