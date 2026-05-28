import { TOKENS, type SemanticTokenId, type ThemeMode } from "@polymorph/spec";
import type { ImportReport, ImportResult } from "./tokens-studio.js";
import { figmaColorToHex, type FigmaVariableColorValue } from "./figma-variables.js";

const MODE_SENSITIVE = new Map(TOKENS.map((t) => [t.id, t.modeSensitive]));
const TYPE_OF = new Map(TOKENS.map((t) => [t.id, t.type]));

// --- Figma styles input (curated by the FI's tooling) -----------------------
//
// We don't accept the raw `GET /v1/files/:key/styles` + `/v1/files/:key/nodes` shape directly
// — those endpoints return descriptive metadata that requires an extra round-trip to extract
// the actual `style` block per node. Orgs already have tooling that fetches a file's text +
// effect styles and reduces them to the curated shape below; that's the contract.
//
// A reference fetcher is documented in `docs/guides/figma-styles.md`.

/** One Figma text style, normalised to its essential typography properties. */
export interface FigmaTextStyle {
  fontFamily: string;
  fontWeight: number;
  /** Font size in CSS pixels. */
  fontSize: number;
  /** Pixel line-height (Figma's `lineHeightPx`). Mutually exclusive with `lineHeightPercent`. */
  lineHeightPx?: number;
  /** Percent line-height (Figma's `lineHeightPercent`, e.g. `140` for 1.4×). */
  lineHeightPercent?: number;
  /** Letter spacing in CSS pixels (Figma's `letterSpacing`). */
  letterSpacing?: number;
}

/** One Figma effect (drop / inner shadow). Blurs aren't representable in the contract. */
export interface FigmaEffect {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  color?: FigmaVariableColorValue;
  offset?: { x: number; y: number };
  /** Blur radius in CSS pixels (Figma's effect `radius`). */
  radius?: number;
  spread?: number;
  visible?: boolean;
}

/** Curated input shape — keys are Figma style names, values are the resolved properties. */
export interface FigmaStylesInput {
  textStyles: Record<string, FigmaTextStyle>;
  effectStyles: Record<string, FigmaEffect[]>;
}

// --- Mapping (FI-supplied) ---------------------------------------------------

export interface FigmaStylesMapping {
  /** Polymorph typography semantic id → Figma text style name. */
  textStyles: Partial<Record<SemanticTokenId, string>>;
  /** Polymorph shadow semantic id → Figma effect style name. */
  effectStyles: Partial<Record<SemanticTokenId, string>>;
  /**
   * For mode-sensitive shadows (`pm.elevation.*`): which Polymorph mode the imported values
   * land under. Default: `"light"`. The same Figma effect emits into one mode only — orgs
   * with dark-mode-specific shadows ship two separate imports + merge.
   */
  mode?: ThemeMode;
}

// --- helpers -----------------------------------------------------------------

function setPath(root: Record<string, unknown>, segs: string[], leaf: unknown): void {
  let cur = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]!;
    if (!cur[seg] || typeof cur[seg] !== "object") cur[seg] = {};
    cur = cur[seg] as Record<string, unknown>;
  }
  cur[segs[segs.length - 1]!] = leaf;
}

interface DtcgToken {
  $type: string;
  $value: unknown;
}

/**
 * Convert one Figma text style to a Polymorph DTCG `typography` token. Line-height resolves
 * `lineHeightPx` → multiplier (`lineHeightPx / fontSize`) or `lineHeightPercent` → fraction
 * (`/ 100`); when neither is supplied, defaults to `1.4` (the contract's de-facto value).
 */
export function convertFigmaTextStyle(style: FigmaTextStyle): DtcgToken | null {
  if (typeof style.fontFamily !== "string" || typeof style.fontWeight !== "number" || typeof style.fontSize !== "number") {
    return null;
  }
  let lineHeight = 1.4;
  if (typeof style.lineHeightPx === "number" && style.fontSize > 0) {
    lineHeight = style.lineHeightPx / style.fontSize;
  } else if (typeof style.lineHeightPercent === "number") {
    lineHeight = style.lineHeightPercent / 100;
  }
  const letterSpacing = typeof style.letterSpacing === "number" ? style.letterSpacing : 0;
  return {
    $type: "typography",
    $value: {
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontSize: { value: style.fontSize, unit: "px" },
      lineHeight,
      letterSpacing: { value: letterSpacing, unit: "px" },
    },
  };
}

/**
 * Convert one or more Figma effects to a Polymorph DTCG `shadow` token. DROP_SHADOW /
 * INNER_SHADOW are supported; LAYER_BLUR / BACKGROUND_BLUR aren't representable in the
 * contract and are dropped silently. `inset` lifts on INNER_SHADOW.
 */
export function convertFigmaEffects(effects: FigmaEffect[]): DtcgToken | null {
  const shadows = effects
    .filter((e) => (e.visible ?? true) && (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW"))
    .map((e) => {
      if (!e.color || !e.offset || typeof e.radius !== "number") return null;
      const out: Record<string, unknown> = {
        color: figmaColorToHex(e.color),
        offsetX: { value: e.offset.x, unit: "px" },
        offsetY: { value: e.offset.y, unit: "px" },
        blur: { value: e.radius, unit: "px" },
        spread: { value: typeof e.spread === "number" ? e.spread : 0, unit: "px" },
      };
      if (e.type === "INNER_SHADOW") out.inset = true;
      return out;
    })
    .filter((s): s is Record<string, unknown> => s !== null);
  if (shadows.length === 0) return null;
  return { $type: "shadow", $value: shadows.length === 1 ? shadows[0] : shadows };
}

// --- importer ----------------------------------------------------------------

/**
 * Import a curated Figma styles input into the typography + shadow slots of a Polymorph
 * theme. Returns the same `ImportResult` shape as the other importers
 * (`importTokensStudio`, `importFigmaVariables`), so a multi-source pipeline can merge the
 * outputs.
 *
 * Scope: `typography` (all `pm.typography.*`) and `shadow` (all `pm.elevation.*`) tokens
 * only. Colors / dimensions come from the Variables importer; component tokens stay
 * hand-authored. Each importer fills its slice of the theme; merge externally.
 */
export function importFigmaStyles(input: FigmaStylesInput, mapping: FigmaStylesMapping): ImportResult {
  const pm: Record<string, unknown> = {};
  const report: ImportReport = { imported: [], missing: [], unconvertible: [] };
  const mode = mapping.mode ?? "light";

  // Typography: always mode-invariant per the contract (`modeSensitive: false`). Land under
  // `pm.*` directly.
  for (const [pmId, styleName] of Object.entries(mapping.textStyles) as [SemanticTokenId, string][]) {
    const dtcgType = TYPE_OF.get(pmId);
    if (dtcgType !== "typography") continue;
    const style = input.textStyles[styleName];
    if (!style) {
      report.missing.push({ id: pmId, path: styleName, mode: "invariant" });
      continue;
    }
    const token = convertFigmaTextStyle(style);
    if (!token) {
      report.unconvertible.push({ id: pmId, from: "TEXT_STYLE", to: "typography", mode: "invariant" });
      continue;
    }
    const segs = pmId.replace(/^pm\./, "").split(".");
    setPath(pm, segs, token);
    report.imported.push(pmId);
  }

  // Effect styles → shadow tokens. Shadows ARE mode-sensitive in the contract, so land under
  // `pm.modes.<mode>.*` (default `"light"`; orgs with dark-mode shadows run a second import).
  for (const [pmId, styleName] of Object.entries(mapping.effectStyles) as [SemanticTokenId, string][]) {
    const dtcgType = TYPE_OF.get(pmId);
    if (dtcgType !== "shadow") continue;
    const effects = input.effectStyles[styleName];
    if (!effects) {
      report.missing.push({ id: pmId, path: styleName, mode });
      continue;
    }
    const token = convertFigmaEffects(effects);
    if (!token) {
      report.unconvertible.push({ id: pmId, from: "EFFECT_STYLE", to: "shadow", mode });
      continue;
    }
    const segs = pmId.replace(/^pm\./, "").split(".");
    const target = MODE_SENSITIVE.get(pmId)
      ? (((pm.modes ??= {} as Record<string, unknown>) as Record<string, unknown>)[mode] ??=
          {} as Record<string, unknown>)
      : pm;
    setPath(target as Record<string, unknown>, segs, token);
    report.imported.push(pmId);
  }

  return { theme: { contractVersion: "0.0.0", pm }, report };
}
