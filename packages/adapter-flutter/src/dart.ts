import { parseColor } from "@polymorph/core";

// --- name conversion ---------------------------------------------------------

/** `pm.color.surface.base` → `colorSurfaceBase`. */
export function idToDartName(id: string): string {
  const stripped = id.replace(/^pm\./, "");
  return camelJoin(stripped.split("."));
}

/** `("button.primary", "background")` → `buttonPrimaryBackground`. */
export function componentPropDartName(role: string, property: string): string {
  return camelJoin([...role.split("."), property]);
}

function camelJoin(parts: string[]): string {
  return parts
    .map((p, i) => (i === 0 ? p : p[0]!.toUpperCase() + p.slice(1)))
    .join("");
}

// --- value-to-Dart helpers ---------------------------------------------------

const dartDouble = (n: number): string => (Number.isInteger(n) ? `${n}.0` : `${n}`);

/** Convert any CSS Color 4 form parseable by `@polymorph/core.parseColor` to `Color(0xAARRGGBB)`. */
export function colorToDart(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let rgb;
  try {
    rgb = parseColor(value);
  } catch {
    return null;
  }
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const hex = (n: number): string => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0").toUpperCase();
  return `Color(0xFF${hex(r)}${hex(g)}${hex(b)})`;
}

interface Dimension {
  value: number;
  unit: "px" | "rem" | string;
}

const isDimension = (v: unknown): v is Dimension =>
  !!v && typeof v === "object" && "value" in v && typeof (v as { value: unknown }).value === "number";

/** dimension `{value, unit}` → Dart `double`. `rem` is converted to px at a 16px base. */
export function dimToDart(value: unknown): string | null {
  if (!isDimension(value)) return null;
  const px = value.unit === "rem" ? value.value * 16 : value.value;
  return dartDouble(px);
}

/** duration `{value, unit}` → `Duration(milliseconds: N)` (or `seconds`). */
export function durationToDart(value: unknown): string | null {
  if (!isDimension(value)) return null;
  if (value.unit === "s") return `Duration(seconds: ${Math.round(value.value)})`;
  return `Duration(milliseconds: ${Math.round(value.value)})`;
}

/** number → Dart `double`. */
export function numberToDart(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value) ? dartDouble(value) : null;
}

/** cubicBezier `[x1,y1,x2,y2]` → `Cubic(...)` (from flutter/animation.dart). */
export function cubicBezierToDart(value: unknown): string | null {
  if (!Array.isArray(value) || value.length !== 4 || !value.every((n) => typeof n === "number")) return null;
  return `Cubic(${value.map((n) => dartDouble(n as number)).join(", ")})`;
}

const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const nearestWeight = (n: number): number =>
  FONT_WEIGHTS.reduce((best, w) => (Math.abs(w - n) < Math.abs(best - n) ? w : best), 400 as number);

/** typography composite → `TextStyle(...)`. Returns null if a required sub-property is missing. */
export function typographyToDart(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const family = typeof o.fontFamily === "string" ? o.fontFamily : null;
  const weight = typeof o.fontWeight === "number" ? nearestWeight(o.fontWeight) : null;
  const size = dimToDart(o.fontSize);
  const height = typeof o.lineHeight === "number" ? dartDouble(o.lineHeight) : null;
  const tracking = dimToDart(o.letterSpacing);
  if (family === null || weight === null || size === null || height === null || tracking === null) return null;
  return [
    "TextStyle(",
    `      fontFamily: '${family.replace(/'/g, "\\'")}',`,
    `      fontWeight: FontWeight.w${weight},`,
    `      fontSize: ${size},`,
    `      height: ${height},`,
    `      letterSpacing: ${tracking},`,
    "    )",
  ].join("\n");
}

interface ShadowOne {
  color?: unknown;
  offsetX?: unknown;
  offsetY?: unknown;
  blur?: unknown;
  spread?: unknown;
  inset?: unknown;
}

function singleShadowToDart(s: unknown): string | null {
  if (!s || typeof s !== "object") return null;
  const o = s as ShadowOne;
  const color = colorToDart(o.color);
  const x = dimToDart(o.offsetX);
  const y = dimToDart(o.offsetY);
  const blur = dimToDart(o.blur);
  const spread = dimToDart(o.spread);
  if (!color || !x || !y || !blur || !spread) return null;
  const insetComment = o.inset === true ? " /* inset not supported by Flutter BoxShadow */" : "";
  return `BoxShadow(color: ${color}, offset: Offset(${x}, ${y}), blurRadius: ${blur}, spreadRadius: ${spread})${insetComment}`;
}

/** shadow (single object or array) → `[BoxShadow(…), …]`. Returns null if unparseable. */
export function shadowToDart(value: unknown): string | null {
  const items = Array.isArray(value) ? value : [value];
  const out: string[] = [];
  for (const it of items) {
    const s = singleShadowToDart(it);
    if (s) out.push(s);
  }
  if (out.length === 0) return null;
  return `<BoxShadow>[\n      ${out.join(",\n      ")},\n    ]`;
}
