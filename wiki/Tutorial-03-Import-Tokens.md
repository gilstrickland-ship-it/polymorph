# Tutorial 03 — Import tokens from Tokens Studio / Figma

**Time**: ~10 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate).

You already have tokens in Tokens Studio, Figma Variables, or Figma Text/Effect Styles.
Polymorph ships three importers; you pick one (or compose two).

---

## Install the importers

```bash
npm install --save-dev @polymorph/authoring
```

## Path A — Tokens Studio export

```ts
import { importTokensStudio } from "@polymorph/authoring";
import { writeFileSync } from "node:fs";
import tokensExport from "./tokens-studio-export.json" with { type: "json" };
import mapping from "./mapping.json" with { type: "json" };

const { theme, report } = importTokensStudio(tokensExport, mapping);

console.log(report.imported.length, "tokens imported");
console.log(report.missing.length, "missing");
console.log(report.unconvertible.length, "unconvertible");

writeFileSync("mybank.tokens.json", JSON.stringify(theme, null, 2));
```

The `mapping.json` says which Tokens Studio token id maps to which Polymorph `pm.*` id —
example shape:

```jsonc
{
  "invariant": {
    "sets": ["global"],
    "tokens": {
      "pm.color.action.primary.rest": "color.brand.primary.500",
      "pm.space.md": "spacing.scale.4"
    }
  },
  "modes": {
    "light":  { "set": "light",  "tokens": { ... } },
    "dark":   { "set": "dark",   "tokens": { ... } }
  }
}
```

Run validate after — the report won't catch *semantic* shape problems, only *what got mapped*.

## Path B — Figma Variables (REST API)

```ts
import { importFigmaVariables } from "@polymorph/authoring";

const figmaResponse = await fetch(
  "https://api.figma.com/v1/files/<fileKey>/variables/local",
  { headers: { "X-Figma-Token": process.env.FIGMA_TOKEN! } },
).then((r) => r.json());

const { theme, report } = importFigmaVariables(figmaResponse, {
  // Polymorph id → Figma collection/variable name
  invariant: {
    "pm.space.md": "spacing/md",
    "pm.radius.control": "radius/control",
  },
  modes: {
    light: {
      "pm.color.action.primary.rest": "Brand/Primary/Default",
    },
    dark: { ... },
  },
});
```

## Path C — Figma Text + Effect Styles

For typography composites + shadow stacks (which Variables doesn't carry):

```ts
import { importFigmaStyles } from "@polymorph/authoring";

const styles = {
  textStyles: {
    "Heading / H1": { fontFamily: "Inter", fontWeight: 600, fontSize: 24, lineHeightPx: 32 },
    "Body / Default": { fontFamily: "Inter", fontWeight: 400, fontSize: 16, lineHeightPercent: 140 },
  },
  effectStyles: {
    "Elevation / Raised": [
      { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 1 }, radius: 2 },
    ],
  },
};

const { theme, report } = importFigmaStyles(styles, {
  textStyles: {
    "pm.typography.heading": "Heading / H1",
    "pm.typography.body":    "Body / Default",
  },
  effectStyles: {
    "pm.elevation.raised": "Elevation / Raised",
  },
});
```

## Composing two importers

Tokens Studio + Figma Styles is a common combo:

```ts
import { importTokensStudio, importFigmaStyles } from "@polymorph/authoring";

const fromStudio = importTokensStudio(studioExport, studioMapping);
const fromStyles = importFigmaStyles(stylesExport, stylesMapping);

// Shallow-merge the `pm` blocks — each importer fills disjoint slices.
const theme = {
  contractVersion: "0.0.0",
  pm: { ...fromStudio.theme.pm, ...fromStyles.theme.pm },
};
```

## Validate after

```bash
npx polymorph validate mybank.tokens.json
npx polymorph lint mybank.tokens.json --mode light
```

## Real-world findings

The wiki's [Report R1](Report-01-Build-From-Primer) is exactly this workflow applied to
GitHub's published `@primer/primitives` — 59/70 Polymorph tokens map 1:1 to Primer's
semantic vocabulary; the remaining 11 need sensible FI defaults. The report walks through
every mapping decision.

## What's next

- [Tutorial 02](Tutorial-02-Author-A-Theme) for the parts the importer didn't cover
- [Tutorial 11](Tutorial-11-Migrate-And-Diff) to keep the imported theme in sync with the contract
