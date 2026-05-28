import { parseColor } from "@polymorph/core";

// --- name conversion ---------------------------------------------------------

/** `pm.color.surface.base` → `colorSurfaceBase`. */
export function idToSwiftName(id: string): string {
  const stripped = id.replace(/^pm\./, "");
  return camelJoin(stripped.split("."));
}

/** `("button.primary", "background")` → `buttonPrimaryBackground`. */
export function componentPropSwiftName(role: string, property: string): string {
  return camelJoin([...role.split("."), property]);
}

function camelJoin(parts: string[]): string {
  return parts
    .map((p, i) => (i === 0 ? p : p[0]!.toUpperCase() + p.slice(1)))
    .join("");
}

// --- value-to-Swift helpers --------------------------------------------------

/** Swift `Double` literals always carry an explicit decimal so the compiler infers `Double`. */
const swiftDouble = (n: number): string => (Number.isInteger(n) ? `${n}.0` : `${n}`);

/** 0..255 → 0...1 with 4 decimals (stable across runs, plenty for sRGB). */
const channel = (n: number): string => {
  const v = Math.max(0, Math.min(255, Math.round(n))) / 255;
  return v.toFixed(4).replace(/\.?0+$/, "") || "0";
};

/** Convert any CSS Color 4 form parseable by `@polymorph/core.parseColor` to SwiftUI `Color(red:green:blue:)`. */
export function colorToSwift(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let rgb;
  try {
    rgb = parseColor(value);
  } catch {
    return null;
  }
  if (!rgb) return null;
  const [r, g, b] = rgb;
  return `Color(red: ${channel(r)}, green: ${channel(g)}, blue: ${channel(b)})`;
}

interface Dimension {
  value: number;
  unit: "px" | "rem" | string;
}

const isDimension = (v: unknown): v is Dimension =>
  !!v && typeof v === "object" && "value" in v && typeof (v as { value: unknown }).value === "number";

/** dimension `{value, unit}` → Swift `CGFloat` literal. `rem` is converted to px at a 16px base. */
export function dimToSwift(value: unknown): string | null {
  if (!isDimension(value)) return null;
  const px = value.unit === "rem" ? value.value * 16 : value.value;
  return swiftDouble(px);
}

/** duration `{value, unit}` → Swift `TimeInterval` (seconds — `Double`). 220ms → `0.22`. */
export function durationToSwift(value: unknown): string | null {
  if (!isDimension(value)) return null;
  const seconds = value.unit === "s" ? value.value : value.value / 1000;
  return swiftDouble(Math.round(seconds * 1000) / 1000);
}

/** number → Swift `Double`. */
export function numberToSwift(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value) ? swiftDouble(value) : null;
}

/** cubicBezier `[x1,y1,x2,y2]` → Swift `(Double, Double, Double, Double)` tuple literal. */
export function cubicBezierToSwift(value: unknown): string | null {
  if (!Array.isArray(value) || value.length !== 4 || !value.every((n) => typeof n === "number")) return null;
  return `(${value.map((n) => swiftDouble(n as number)).join(", ")})`;
}

const FONT_WEIGHTS: Record<number, string> = {
  100: ".ultraLight",
  200: ".thin",
  300: ".light",
  400: ".regular",
  500: ".medium",
  600: ".semibold",
  700: ".bold",
  800: ".heavy",
  900: ".black",
};
const WEIGHT_STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const nearestWeight = (n: number): string => {
  const w = WEIGHT_STEPS.reduce((best, step) => (Math.abs(step - n) < Math.abs(best - n) ? step : best), 400 as number);
  return FONT_WEIGHTS[w]!;
};

/** typography composite → `PolymorphTextStyle(...)` (helper struct emitted in the same file). */
export function typographyToSwift(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const family = typeof o.fontFamily === "string" ? o.fontFamily : null;
  const weight = typeof o.fontWeight === "number" ? nearestWeight(o.fontWeight) : null;
  const size = dimToSwift(o.fontSize);
  const lineHeight = typeof o.lineHeight === "number" ? swiftDouble(o.lineHeight) : null;
  const tracking = dimToSwift(o.letterSpacing);
  if (family === null || weight === null || size === null || lineHeight === null || tracking === null) return null;
  return [
    "PolymorphTextStyle(",
    `      font: Font.custom("${family.replace(/"/g, '\\"')}", size: ${size}),`,
    `      fontSize: ${size},`,
    `      weight: ${weight},`,
    `      lineHeight: ${lineHeight},`,
    `      letterSpacing: ${tracking}`,
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

function singleShadowToSwift(s: unknown): string | null {
  if (!s || typeof s !== "object") return null;
  const o = s as ShadowOne;
  const color = colorToSwift(o.color);
  const x = dimToSwift(o.offsetX);
  const y = dimToSwift(o.offsetY);
  const blur = dimToSwift(o.blur);
  if (!color || !x || !y || !blur) return null;
  const insetComment = o.inset === true ? " /* inset not supported by SwiftUI .shadow */" : "";
  return `PolymorphShadow(color: ${color}, x: ${x}, y: ${y}, radius: ${blur})${insetComment}`;
}

/** shadow (single object or array) → Swift `[PolymorphShadow]`. Returns null if unparseable. */
export function shadowToSwift(value: unknown): string | null {
  const items = Array.isArray(value) ? value : [value];
  const out: string[] = [];
  for (const it of items) {
    const s = singleShadowToSwift(it);
    if (s) out.push(s);
  }
  if (out.length === 0) return null;
  return `[\n      ${out.join(",\n      ")},\n    ]`;
}
