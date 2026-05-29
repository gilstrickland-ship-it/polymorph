// Read `@primer/primitives`'s CSS theme exports and surface them as
// `{ name → hex }` maps. Primer's published CSS files (`dist/css/functional/themes/{light,dark}.css`)
// are the canonical consumption surface — every value is pre-resolved (no alias chasing),
// every variable is documented, and the format is stable across releases.
//
// We use a real, published consumer surface — not their proprietary `dist/figma/`
// file — so the test exercises the contract the way a host application actually would.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);

/** Resolve a path inside `@primer/primitives` from the installed package. */
export function primerPath(...segments: string[]): string {
  const pkgJson = require_.resolve("@primer/primitives/package.json");
  const pkgRoot = dirname(pkgJson);
  return join(pkgRoot, ...segments);
}

/** `--<name>: <value>;` parser. Strips comments + the wrapping `:root` selector. */
export function parseCssVars(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Strip block comments.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of stripped.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1]!.trim();
    const value = match[2]!.trim();
    out[name] = value;
  }
  return out;
}

/** Load one Primer theme by name, e.g. "light" / "dark" / "light-high-contrast". */
export function loadPrimerTheme(theme: string): Record<string, string> {
  const css = readFileSync(primerPath("dist", "css", "functional", "themes", `${theme}.css`), "utf8");
  return parseCssVars(css);
}

/**
 * Load Primer's mode-invariant vars (spacing / radius / typography / motion). We merge
 * across multiple Primer CSS files because the real vars are split: `base/typography`
 * holds the raw font scale, `functional/spacing/space.css` holds named `--space-*` tokens,
 * `functional/size/radius.css` holds `--borderRadius-*`, `functional/motion` holds the
 * easing/duration semantic tokens. The FI only sees resolved values; Primer's internal
 * layering doesn't leak out.
 */
export function loadPrimerBase(): Record<string, string> {
  const out: Record<string, string> = {};
  const probe = [
    ["base", "size", "size.css"],
    ["base", "typography", "typography.css"],
    ["base", "motion", "motion.css"],
    ["functional", "spacing", "space.css"],
    ["functional", "size", "radius.css"],
    ["functional", "size", "border.css"],
    ["functional", "size", "size.css"],
    ["functional", "typography", "typography.css"],
    ["functional", "motion", "motion.css"],
  ];
  for (const segs of probe) {
    try {
      const css = readFileSync(primerPath("dist", "css", ...segs), "utf8");
      const parsed = parseCssVars(css);
      // First-write-wins so the base-layer values are preserved when functional layers
      // alias them; functional layers add new names without overwriting raw scale tokens.
      for (const [k, v] of Object.entries(parsed)) {
        if (out[k] === undefined) out[k] = v;
      }
    } catch {
      // Primer file structure shifts across minors; tolerate absence.
    }
  }
  return out;
}

/** Primer's published Figma JSON, as a flat array of records. Used for descriptive metadata. */
export function loadPrimerFigmaTokens(theme: string): Array<{
  name: string;
  value: string | number | object;
  type: string;
  scopes?: string[];
  mode: string;
  collection?: string;
  group?: string;
}> {
  const path = primerPath("dist", "figma", "themes", `${theme}.json`);
  return JSON.parse(readFileSync(path, "utf8")) as Array<{
    name: string;
    value: string | number | object;
    type: string;
    scopes?: string[];
    mode: string;
    collection?: string;
    group?: string;
  }>;
}

// Convenient self-test helper for the report generator.
export function describePrimer(theme: "light" | "dark" = "light"): {
  themeName: string;
  cssVarCount: number;
  baseVarCount: number;
  figmaTokenCount: number;
} {
  const themed = loadPrimerTheme(theme);
  const base = loadPrimerBase();
  let figmaCount = 0;
  try {
    figmaCount = loadPrimerFigmaTokens(theme).length;
  } catch {
    figmaCount = 0;
  }
  return {
    themeName: theme,
    cssVarCount: Object.keys(themed).length,
    baseVarCount: Object.keys(base).length,
    figmaTokenCount: figmaCount,
  };
}

// Keep the loader file referenceable for the wiki — exporting `fileURLToPath` chains so the
// generator can include "the loader is N lines" in the report.
export function loaderFileLineCount(): number {
  const here = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(here, "primer-loader.ts"), "utf8").split("\n").length;
}
