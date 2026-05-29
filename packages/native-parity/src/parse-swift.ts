import type { NormalizedSnapshot, NormalizedValue } from "./types.js";

// `public static let <name>: <Type> = <literal>` — literal spans until end-of-block, marked
// by the next `public static let` or end-of-file. We grab up to the next blank-then-`public`
// or end of input.
// Terminate the literal at the next `public static let` / `// MARK` / closing brace. Drop
// the `|$` alternative: under `m`, `$` matches end-of-line, which prematurely truncates
// multi-line literals (`PolymorphTextStyle(...)`, `[PolymorphShadow(...), ...]`).
const ENTRY_RE = /^\s*public static let (\w+):\s*([^=]+?)\s*=\s*([\s\S]+?)(?=\n\s*public static let|\n\s*\/\/ MARK|\n\s*\})/gm;

const SWIFT_WEIGHT: Record<string, number> = {
  ".ultraLight": 100,
  ".thin": 200,
  ".light": 300,
  ".regular": 400,
  ".medium": 500,
  ".semibold": 600,
  ".bold": 700,
  ".heavy": 800,
  ".black": 900,
};

const COLOR_RE = /Color\(red:\s*([\d.]+),\s*green:\s*([\d.]+),\s*blue:\s*([\d.]+)\)/;

const channelToHex = (n: number): string => {
  const v = Math.max(0, Math.min(255, Math.round(n * 255)));
  return v.toString(16).padStart(2, "0");
};

function parseColor(literal: string): NormalizedValue | null {
  const m = literal.match(COLOR_RE);
  if (!m) return null;
  return {
    kind: "color",
    hex: `#${channelToHex(Number(m[1]!))}${channelToHex(Number(m[2]!))}${channelToHex(Number(m[3]!))}`,
  };
}

function parseDimension(literal: string): NormalizedValue | null {
  const n = Number(literal.trim());
  return Number.isFinite(n) ? { kind: "dimension", px: n } : null;
}

function parseNumber(literal: string): NormalizedValue | null {
  const n = Number(literal.trim());
  return Number.isFinite(n) ? { kind: "number", n } : null;
}

function parseDuration(literal: string): NormalizedValue | null {
  // Swift emits seconds (TimeInterval). Convert to ms with rounding (avoids 0.22 * 1000 = 220.00000000000003).
  const seconds = Number(literal.trim());
  if (!Number.isFinite(seconds)) return null;
  return { kind: "duration", ms: Math.round(seconds * 1000) };
}

function parseCubic(literal: string): NormalizedValue | null {
  const m = literal.match(/\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1]!.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  return { kind: "cubicBezier", values: parts as [number, number, number, number] };
}

function parseTypography(literal: string): NormalizedValue | null {
  // Handle escaped quotes inside the family string — Swift codegen emits `\"`-escaped
  // quotes for font families that contain them (e.g. GitHub Primer's stack:
  // `"Mona Sans VF", -apple-system, "Segoe UI", …`). Caught by the Primer integration
  // test; the previous regex stopped at the first quote and captured only the prefix.
  const family = literal.match(/font:\s*Font\.custom\("((?:\\.|[^"\\])*)"/);
  const size = literal.match(/fontSize:\s*([\d.]+)/);
  const weightTok = literal.match(/weight:\s*(\.\w+)/);
  const height = literal.match(/lineHeight:\s*([\d.]+)/);
  const tracking = literal.match(/letterSpacing:\s*([\d.]+)/);
  if (!family || !size || !weightTok || !height || !tracking) return null;
  const weight = SWIFT_WEIGHT[weightTok[1]!];
  if (weight === undefined) return null;
  return {
    kind: "typography",
    // Unescape so the captured family matches the input to `transformToSwift`.
    family: family[1]!.replace(/\\(.)/g, "$1"),
    weight,
    fontSizePx: Number(size[1]!),
    lineHeight: Number(height[1]!),
    letterSpacingPx: Number(tracking[1]!),
  };
}

function parseShadow(literal: string): NormalizedValue | null {
  const boxes = [...literal.matchAll(/PolymorphShadow\(color:\s*(Color\(red:[^)]+\)),\s*x:\s*([\d.]+),\s*y:\s*([\d.]+),\s*radius:\s*([\d.]+)\)/g)];
  if (boxes.length === 0) return null;
  const shadows = boxes
    .map((b) => {
      const colorMatch = b[1]!.match(COLOR_RE);
      if (!colorMatch) return null;
      return {
        hex: `#${channelToHex(Number(colorMatch[1]!))}${channelToHex(Number(colorMatch[2]!))}${channelToHex(Number(colorMatch[3]!))}`,
        xPx: Number(b[2]!),
        yPx: Number(b[3]!),
        blurPx: Number(b[4]!),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
  return shadows.length === 0 ? null : { kind: "shadow", shadows };
}

/** Parse Swift codegen output (`transformToSwift` result) into a normalized per-token snapshot. */
export function parseSwift(source: string): NormalizedSnapshot {
  const out: NormalizedSnapshot = new Map();
  for (const m of source.matchAll(ENTRY_RE)) {
    const name = m[1]!;
    const type = m[2]!.trim();
    const literal = m[3]!.trim();
    let value: NormalizedValue | null = null;
    switch (type) {
      case "Color":
        value = parseColor(literal);
        break;
      case "CGFloat":
        value = parseDimension(literal);
        break;
      case "Double":
        value = parseNumber(literal);
        break;
      case "TimeInterval":
        value = parseDuration(literal);
        break;
      case "(Double, Double, Double, Double)":
        value = parseCubic(literal);
        break;
      case "PolymorphTextStyle":
        value = parseTypography(literal);
        break;
      case "[PolymorphShadow]":
        value = parseShadow(literal);
        break;
      default:
        continue;
    }
    if (value) out.set(name, value);
  }
  return out;
}
