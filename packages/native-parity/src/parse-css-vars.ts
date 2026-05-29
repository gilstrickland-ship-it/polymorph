import type { NormalizedSnapshot, NormalizedValue } from "./types.js";

/**
 * Parse the Web adapter's `toCssVariables(resolved)` output back into a `NormalizedSnapshot`
 * with the same camelCase keys the native parsers produce. Used by the runtime-parity check
 * to assert every adapter agrees with core's resolution.
 *
 * The Web adapter expands typography into one CSS variable per sub-property
 * (`--foo-font-family`, `--foo-font-weight`, `--foo-font-size`, `--foo-line-height`,
 * `--foo-letter-spacing`); this parser groups them back into the composite `typography`
 * normalized value so the diff against the native side is symmetric.
 */
export function parseCssVars(vars: Record<string, string>): NormalizedSnapshot {
  const out: NormalizedSnapshot = new Map();
  const typographyAcc = new Map<string, Partial<TypographyAcc>>();
  const shadowAcc = new Map<string, NormalizedValue>();

  for (const [rawName, rawValue] of Object.entries(vars)) {
    if (!rawName.startsWith("--pm-")) continue;
    const cssId = rawName.slice(2); // strip "--"

    // Typography sub-properties: detect by the trailing fragment.
    const typoMatch = cssId.match(/^(.+?)-(font-family|font-weight|font-size|line-height|letter-spacing)$/);
    if (typoMatch) {
      const base = typoMatch[1]!;
      const slot = typoMatch[2]!;
      const name = cssIdToCamelName(base);
      const acc = typographyAcc.get(name) ?? {};
      switch (slot) {
        case "font-family":
          acc.family = rawValue;
          break;
        case "font-weight":
          acc.weight = Number(rawValue);
          break;
        case "font-size": {
          const px = parseLength(rawValue);
          if (px !== null) acc.fontSizePx = px;
          break;
        }
        case "line-height":
          acc.lineHeight = Number(rawValue);
          break;
        case "letter-spacing": {
          const px = parseLength(rawValue);
          if (px !== null) acc.letterSpacingPx = px;
          break;
        }
      }
      typographyAcc.set(name, acc);
      continue;
    }

    const name = cssIdToCamelName(cssId);
    const value = parseValue(rawValue);
    if (value) out.set(name, value);
  }

  for (const [name, acc] of typographyAcc) {
    if (
      typeof acc.family === "string" &&
      typeof acc.weight === "number" &&
      typeof acc.fontSizePx === "number" &&
      typeof acc.lineHeight === "number" &&
      typeof acc.letterSpacingPx === "number"
    ) {
      out.set(name, {
        kind: "typography",
        family: acc.family,
        weight: acc.weight,
        fontSizePx: acc.fontSizePx,
        lineHeight: acc.lineHeight,
        letterSpacingPx: acc.letterSpacingPx,
      });
    }
  }

  for (const [name, value] of shadowAcc) out.set(name, value);

  return out;
}

interface TypographyAcc {
  family: string;
  weight: number;
  fontSizePx: number;
  lineHeight: number;
  letterSpacingPx: number;
}

/** `pm-color-surface-base` → `colorSurfaceBase`. */
function cssIdToCamelName(id: string): string {
  return id
    .replace(/^pm-/, "")
    .split("-")
    .map((seg, i) => (i === 0 ? seg : seg[0]!.toUpperCase() + seg.slice(1)))
    .join("");
}

function parseValue(raw: string): NormalizedValue | null {
  const v = raw.trim();
  // color: `#rrggbb` or `#rrggbbaa`
  if (v.startsWith("#")) return { kind: "color", hex: v.slice(0, 7).toLowerCase() };
  // duration: `220ms` / `0.22s`
  const ms = v.match(/^(-?\d+(?:\.\d+)?)\s*ms$/);
  if (ms) return { kind: "duration", ms: Number(ms[1]) };
  const s = v.match(/^(-?\d+(?:\.\d+)?)\s*s$/);
  if (s) return { kind: "duration", ms: Number(s[1]) * 1000 };
  // cubic-bezier: `cubic-bezier(0.4, 0, 0.2, 1)`
  const cb = v.match(/^cubic-bezier\s*\(\s*([^)]+)\)\s*$/);
  if (cb) {
    const parts = cb[1]!.split(",").map((p) => Number(p.trim()));
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      return { kind: "cubicBezier", values: parts as [number, number, number, number] };
    }
  }
  // dimension: REQUIRES an explicit unit (`8px` / `0.5rem` / `1em`) — bare numbers fall
  // through to the `number` branch below. Otherwise `0.4` (opacity) would be misclassified
  // as a 0.4px dimension.
  const dim = v.match(/^(-?\d+(?:\.\d+)?)\s*(px|rem|em)$/);
  if (dim) {
    const n = Number(dim[1]);
    if (Number.isFinite(n)) return { kind: "dimension", px: dim[2] === "px" ? n : n * 16 };
  }
  // bare number
  const n = Number(v);
  if (Number.isFinite(n)) return { kind: "number", n };
  // shadow: `0px 1px 2px 0px #00000022` (single) or comma-separated multi
  const sh = parseShadows(v);
  if (sh) return sh;
  return null;
}

function parseLength(raw: string): number | null {
  const m = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*(px|rem|em)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = m[2] ?? "px";
  return unit === "px" ? n : n * 16;
}

function parseShadows(raw: string): NormalizedValue | null {
  const parts = splitTopLevel(raw, ",");
  const shadows: { hex: string; xPx: number; yPx: number; blurPx: number }[] = [];
  for (const p of parts) {
    const s = p.trim();
    // `[inset ]? <ox> <oy> <blur> <spread> <color>` — color is `#...` at the end.
    const colorMatch = s.match(/#[0-9a-fA-F]{6,8}/);
    if (!colorMatch) return null;
    const color = colorMatch[0]!;
    const dims = s
      .slice(0, colorMatch.index)
      .trim()
      .replace(/^inset\s+/, "")
      .split(/\s+/)
      .map(parseLength);
    if (dims.length < 3) return null;
    const [ox, oy, blur] = dims;
    if (typeof ox !== "number" || typeof oy !== "number" || typeof blur !== "number") return null;
    shadows.push({ hex: color.slice(0, 7).toLowerCase(), xPx: ox, yPx: oy, blurPx: blur });
  }
  if (shadows.length === 0) return null;
  return { kind: "shadow", shadows };
}

/** Split on `sep` but ignore separators inside `(...)`. */
function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth === 0 && ch === sep) {
      out.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf) out.push(buf);
  return out;
}
