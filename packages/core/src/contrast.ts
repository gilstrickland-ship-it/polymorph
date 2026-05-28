// Pure WCAG 2.1 contrast utilities. Parses common CSS Color 4 forms (hex, rgb/rgba, hsl/hsla,
// oklch, oklab, color(display-p3 …)) into sRGB and computes the relative-luminance ratio.
// Unparseable forms (e.g. `currentColor`, gradients, unsupported color spaces) return null from
// parseColor and cause contrastRatio to throw — the advisory linter surfaces that as a skipped
// check, never a failure.

type RGB = [number, number, number]; // sRGB, 0..255 (gamma-encoded)

// --- sRGB gamma helpers ------------------------------------------------------

const srgbEncode = (c: number): number => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(1, v));
};
const linearToSrgb = ([r, g, b]: RGB): RGB => [
  Math.round(srgbEncode(r) * 255),
  Math.round(srgbEncode(g) * 255),
  Math.round(srgbEncode(b) * 255),
];

// --- HSL → sRGB --------------------------------------------------------------

function hslToRgb(h: number, s: number, l: number): RGB {
  // h in degrees [0..360), s/l in [0..1].
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)];
}

// --- OKLab / OKLch → linear sRGB (Ottosson, CSS Color 4) ---------------------

function oklabToLinearSrgb(L: number, a: number, b: number): RGB {
  const lp = L + 0.3963377774 * a + 0.2158037573 * b;
  const mp = L - 0.1055613458 * a - 0.0638541728 * b;
  const sp = L - 0.0894841775 * a - 1.291485548 * b;
  const l = lp * lp * lp;
  const m = mp * mp * mp;
  const s = sp * sp * sp;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
const oklchToRgb = (L: number, C: number, h: number): RGB => {
  const hr = (h * Math.PI) / 180;
  return linearToSrgb(oklabToLinearSrgb(L, C * Math.cos(hr), C * Math.sin(hr)));
};
const oklabToRgb = (L: number, a: number, b: number): RGB => linearToSrgb(oklabToLinearSrgb(L, a, b));

// --- color(display-p3 …) → linear sRGB → sRGB --------------------------------

const srgbDecode = (c: number): number => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
function displayP3ToRgb(r: number, g: number, b: number): RGB {
  // gamma-encoded display-p3 in 0..1; same transfer function as sRGB.
  const rl = srgbDecode(r);
  const gl = srgbDecode(g);
  const bl = srgbDecode(b);
  // Linear display-p3 → linear sRGB matrix (CSS Color 4).
  const r2 = 1.2249401758 * rl - 0.2249401758 * gl + 0 * bl;
  const g2 = -0.0420569547 * rl + 1.0420569547 * gl + 0 * bl;
  const b2 = -0.0196375546 * rl - 0.0786360818 * gl + 1.0982736363 * bl;
  return linearToSrgb([r2, g2, b2]);
}

// --- parsing -----------------------------------------------------------------

const numOrPct = (p: string, scale = 1): number | null => {
  const t = p.trim();
  if (t.endsWith("%")) {
    const n = parseFloat(t.slice(0, -1));
    return Number.isFinite(n) ? (n / 100) * scale : null;
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
};
const angle = (p: string): number | null => {
  const t = p.trim();
  if (t.endsWith("deg")) return parseFloat(t);
  if (t.endsWith("turn")) return parseFloat(t) * 360;
  if (t.endsWith("rad")) return (parseFloat(t) * 180) / Math.PI;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
};
const splitArgs = (inner: string): string[] =>
  inner
    .split("/")[0]! // drop alpha
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

export function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();

  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    const h = hex[1]!;
    if (h.length === 3 || h.length === 4) {
      return [h[0]!, h[1]!, h[2]!].map((c) => parseInt(c + c, 16)) as RGB;
    }
    if (h.length === 6 || h.length === 8) {
      return [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map((c) => parseInt(c, 16)) as RGB;
    }
    return null;
  }

  const rgb = s.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = splitArgs(rgb[1]!);
    if (parts.length < 3) return null;
    const ch = (p: string): number | null => {
      const n = numOrPct(p, 255);
      return n === null ? null : n;
    };
    const r = ch(parts[0]!);
    const g = ch(parts[1]!);
    const b = ch(parts[2]!);
    if (r === null || g === null || b === null) return null;
    if ([r, g, b].some((c) => c < 0 || c > 255)) return null;
    return [Math.round(r), Math.round(g), Math.round(b)];
  }

  const hsl = s.match(/^hsla?\(([^)]+)\)$/);
  if (hsl) {
    const parts = splitArgs(hsl[1]!);
    if (parts.length < 3) return null;
    const h = angle(parts[0]!);
    const sat = numOrPct(parts[1]!);
    const lig = numOrPct(parts[2]!);
    if (h === null || sat === null || lig === null) return null;
    return hslToRgb(h, sat, lig);
  }

  const oklch = s.match(/^oklch\(([^)]+)\)$/);
  if (oklch) {
    const parts = splitArgs(oklch[1]!);
    if (parts.length < 3) return null;
    const L = numOrPct(parts[0]!);
    const C = numOrPct(parts[1]!);
    const h = angle(parts[2]!);
    if (L === null || C === null || h === null) return null;
    return oklchToRgb(L, C, h);
  }

  const oklab = s.match(/^oklab\(([^)]+)\)$/);
  if (oklab) {
    const parts = splitArgs(oklab[1]!);
    if (parts.length < 3) return null;
    const L = numOrPct(parts[0]!);
    const a = numOrPct(parts[1]!);
    const b = numOrPct(parts[2]!);
    if (L === null || a === null || b === null) return null;
    return oklabToRgb(L, a, b);
  }

  const color = s.match(/^color\(\s*display-p3\s+([^)]+)\)$/);
  if (color) {
    const parts = splitArgs(color[1]!);
    if (parts.length < 3) return null;
    const r = numOrPct(parts[0]!);
    const g = numOrPct(parts[1]!);
    const b = numOrPct(parts[2]!);
    if (r === null || g === null || b === null) return null;
    return displayP3ToRgb(r, g, b);
  }

  return null;
}

// --- WCAG 2.1 luminance + ratio ---------------------------------------------

function relativeLuminance([r, g, b]: RGB): number {
  const lin = (c: number): number => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.1 contrast ratio (1..21). Throws if either color is unparseable. */
export function contrastRatio(a: string, b: string): number {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca) throw new Error(`unparseable color: ${a}`);
  if (!cb) throw new Error(`unparseable color: ${b}`);
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
