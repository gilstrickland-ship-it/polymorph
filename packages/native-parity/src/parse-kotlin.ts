import type { NormalizedSnapshot, NormalizedValue } from "./types.js";

// `val <name>: <Type> = <literal>` — literal spans to end-of-block, terminated by the next
// `val ` or `// endregion` / `}`.
// Terminate the literal at the next `val ` / `// endregion` / `}` line. The `|$` form fails
// under the `m` flag because `$` matches end-of-line, which prematurely cuts multi-line
// literals (`PolymorphTextStyle(...)`, `listOf(PolymorphShadow(...), ...)`); we omit it and
// rely on the next val / endregion / closing brace always being present in well-formed input.
const ENTRY_RE = /^\s*val (\w+):\s*([^=]+?)\s*=\s*([\s\S]+?)(?=\n\s*val |\n\s*\/\/ endregion|\n\s*\})/gm;

const COLOR_RE = /Color\(0x([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})\)/;

const stripAlphaHex = (a: string, r: string, g: string, b: string): string => {
  void a;
  return `#${r.toLowerCase()}${g.toLowerCase()}${b.toLowerCase()}`;
};

function parseColor(literal: string): NormalizedValue | null {
  const m = literal.match(COLOR_RE);
  if (!m) return null;
  return { kind: "color", hex: stripAlphaHex(m[1]!, m[2]!, m[3]!, m[4]!) };
}

function parseDimension(literal: string): NormalizedValue | null {
  // Kotlin: `8.0f.dp` or `8.0f.sp` — strip the `f.dp` / `f.sp` suffix.
  const m = literal.match(/^([\d.]+)f\.(dp|sp)$/);
  if (!m) return null;
  return { kind: "dimension", px: Number(m[1]!) };
}

function parseNumber(literal: string): NormalizedValue | null {
  // Kotlin: `0.4f` — strip the trailing `f`.
  const m = literal.match(/^([\d.]+)f$/);
  return m ? { kind: "number", n: Number(m[1]!) } : null;
}

function parseDuration(literal: string): NormalizedValue | null {
  // Kotlin: Int milliseconds.
  const n = Number(literal.trim());
  return Number.isFinite(n) ? { kind: "duration", ms: n } : null;
}

function parseCubic(literal: string): NormalizedValue | null {
  const m = literal.match(/CubicBezierEasing\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1]!
    .split(",")
    .map((p) => Number(p.trim().replace(/f$/, "")));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  return { kind: "cubicBezier", values: parts as [number, number, number, number] };
}

function parseTypography(literal: string): NormalizedValue | null {
  // Handle escaped quotes inside the family string — same shape as Swift; codegen emits
  // `\"`-escaped quotes for families containing `"` (e.g. GitHub Primer's stack).
  const family = literal.match(/fontFamily\s*=\s*"((?:\\.|[^"\\])*)"/);
  const size = literal.match(/fontSize\s*=\s*([\d.]+)f\.sp/);
  const weight = literal.match(/fontWeight\s*=\s*FontWeight\.W(\d+)/);
  const height = literal.match(/lineHeight\s*=\s*([\d.]+)f/);
  const tracking = literal.match(/letterSpacing\s*=\s*([\d.]+)f\.sp/);
  if (!family || !size || !weight || !height || !tracking) return null;
  return {
    kind: "typography",
    family: family[1]!.replace(/\\(.)/g, "$1"),
    weight: Number(weight[1]!),
    fontSizePx: Number(size[1]!),
    lineHeight: Number(height[1]!),
    letterSpacingPx: Number(tracking[1]!),
  };
}

function parseShadow(literal: string): NormalizedValue | null {
  const boxes = [
    ...literal.matchAll(
      /PolymorphShadow\(color\s*=\s*(Color\(0x[0-9A-Fa-f]{8}\)),\s*x\s*=\s*([\d.]+)f\.dp,\s*y\s*=\s*([\d.]+)f\.dp,\s*radius\s*=\s*([\d.]+)f\.dp\)/g,
    ),
  ];
  if (boxes.length === 0) return null;
  const shadows = boxes
    .map((b) => {
      const m = b[1]!.match(COLOR_RE);
      if (!m) return null;
      return {
        hex: stripAlphaHex(m[1]!, m[2]!, m[3]!, m[4]!),
        xPx: Number(b[2]!),
        yPx: Number(b[3]!),
        blurPx: Number(b[4]!),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
  return shadows.length === 0 ? null : { kind: "shadow", shadows };
}

/** Slice out just the `object <Name> { ... }` body so we don't pick up helper-struct `val` lines. */
function objectBody(source: string): string {
  const m = source.match(/object \w+\s*\{([\s\S]+)\}\s*$/);
  return m ? m[1]! : source;
}

/** Parse Kotlin codegen output (`transformToKotlin` result) into a normalized per-token snapshot. */
export function parseKotlin(source: string): NormalizedSnapshot {
  const out: NormalizedSnapshot = new Map();
  const body = objectBody(source);
  for (const m of body.matchAll(ENTRY_RE)) {
    const name = m[1]!;
    const type = m[2]!.trim();
    const literal = m[3]!.trim();
    let value: NormalizedValue | null = null;
    switch (type) {
      case "Color":
        value = parseColor(literal);
        break;
      case "Dp":
        value = parseDimension(literal);
        break;
      case "Float":
        value = parseNumber(literal);
        break;
      case "Int":
        value = parseDuration(literal);
        break;
      case "CubicBezierEasing":
        value = parseCubic(literal);
        break;
      case "PolymorphTextStyle":
        value = parseTypography(literal);
        break;
      case "List<PolymorphShadow>":
        value = parseShadow(literal);
        break;
      default:
        continue;
    }
    if (value) out.set(name, value);
  }
  return out;
}
