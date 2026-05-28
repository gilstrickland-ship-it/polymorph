import type { NormalizedSnapshot, NormalizedValue } from "./types.js";

// Captures `static const <Type> <name> = <literal>;` (the literal continues until the matching
// closing token, which we approximate by lazily matching up to the trailing `;` at end-of-line
// — Dart codegen's emitted format is line-oriented enough to make that safe).
const ENTRY_RE = /^\s*static const (\S+) (\w+) = ([\s\S]+?);\s*$/gm;

const FONT_WEIGHT_RE = /FontWeight\.w(\d+)/;
const COLOR_RE = /Color\(0x([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})\)/;

const stripAlphaHex = (a: string, r: string, g: string, b: string): string => {
  void a; // alpha forced to FF in v1; we ignore it for parity comparison
  return `#${r.toLowerCase()}${g.toLowerCase()}${b.toLowerCase()}`;
};

function parseDouble(s: string): number {
  return Number(s.trim());
}

function parseColor(literal: string): NormalizedValue | null {
  const m = literal.match(COLOR_RE);
  if (!m) return null;
  return { kind: "color", hex: stripAlphaHex(m[1]!, m[2]!, m[3]!, m[4]!) };
}

function parseDimension(literal: string): NormalizedValue | null {
  // Dart emits raw `8.0` for `double`. Both dimension and number share this type — caller
  // disambiguates via the Dart type token.
  const n = parseDouble(literal);
  if (!Number.isFinite(n)) return null;
  return { kind: "dimension", px: n };
}

function parseNumber(literal: string): NormalizedValue | null {
  const n = parseDouble(literal);
  return Number.isFinite(n) ? { kind: "number", n } : null;
}

function parseDuration(literal: string): NormalizedValue | null {
  const ms = literal.match(/Duration\(milliseconds:\s*(\d+)\)/);
  if (ms) return { kind: "duration", ms: Number(ms[1]!) };
  const s = literal.match(/Duration\(seconds:\s*(\d+)\)/);
  if (s) return { kind: "duration", ms: Number(s[1]!) * 1000 };
  return null;
}

function parseCubic(literal: string): NormalizedValue | null {
  const m = literal.match(/Cubic\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1]!.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  return { kind: "cubicBezier", values: parts as [number, number, number, number] };
}

function parseTypography(literal: string): NormalizedValue | null {
  const family = literal.match(/fontFamily:\s*'([^']*)'/);
  const weight = literal.match(FONT_WEIGHT_RE);
  const size = literal.match(/fontSize:\s*([\d.]+)/);
  const height = literal.match(/height:\s*([\d.]+)/);
  const tracking = literal.match(/letterSpacing:\s*([\d.]+)/);
  if (!family || !weight || !size || !height || !tracking) return null;
  return {
    kind: "typography",
    family: family[1]!,
    weight: Number(weight[1]!),
    fontSizePx: Number(size[1]!),
    lineHeight: Number(height[1]!),
    letterSpacingPx: Number(tracking[1]!),
  };
}

// `BoxShadow(color: Color(0xAARRGGBB), offset: Offset(X, Y), blurRadius: B, spreadRadius: S)`.
// Use an explicit pattern rather than `BoxShadow\(([^)]+)\)` because the body contains nested
// parens (Color(...), Offset(...)) and a single naive `[^)]+` stops at the first `)`.
const SHADOW_RE =
  /BoxShadow\(color:\s*Color\(0x([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})\),\s*offset:\s*Offset\(([\d.]+),\s*([\d.]+)\),\s*blurRadius:\s*([\d.]+),\s*spreadRadius:\s*[\d.]+\)/g;

function parseShadow(literal: string): NormalizedValue | null {
  const boxes = [...literal.matchAll(SHADOW_RE)];
  if (boxes.length === 0) return null;
  const shadows = boxes.map((b) => ({
    hex: stripAlphaHex(b[1]!, b[2]!, b[3]!, b[4]!),
    xPx: Number(b[5]!),
    yPx: Number(b[6]!),
    blurPx: Number(b[7]!),
  }));
  return { kind: "shadow", shadows };
}

/** Parse Dart codegen output (`transformToDart` result) into a normalized per-token snapshot. */
export function parseDart(source: string): NormalizedSnapshot {
  const out: NormalizedSnapshot = new Map();
  for (const m of source.matchAll(ENTRY_RE)) {
    const type = m[1]!;
    const name = m[2]!;
    const literal = m[3]!;
    let value: NormalizedValue | null = null;
    switch (type) {
      case "Color":
        value = parseColor(literal);
        break;
      case "double":
        // Could be a dimension or a plain number — `pm.opacity.*` etc. The output format is
        // the same. We compare against Swift/Kotlin which face the same ambiguity, so route
        // by name prefix: `opacity*` is number, anything else dimension.
        value = name.startsWith("opacity") ? parseNumber(literal) : parseDimension(literal);
        break;
      case "Duration":
        value = parseDuration(literal);
        break;
      case "Cubic":
        value = parseCubic(literal);
        break;
      case "TextStyle":
        value = parseTypography(literal);
        break;
      case "List<BoxShadow>":
        value = parseShadow(literal);
        break;
      default:
        continue;
    }
    if (value) out.set(name, value);
  }
  return out;
}
