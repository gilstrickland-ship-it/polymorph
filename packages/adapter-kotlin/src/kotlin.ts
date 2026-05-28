import { parseColor } from "@polymorph/core";

// --- name conversion ---------------------------------------------------------

/** `pm.color.surface.base` → `colorSurfaceBase`. */
export function idToKotlinName(id: string): string {
  const stripped = id.replace(/^pm\./, "");
  return camelJoin(stripped.split("."));
}

/** `("button.primary", "background")` → `buttonPrimaryBackground`. */
export function componentPropKotlinName(role: string, property: string): string {
  return camelJoin([...role.split("."), property]);
}

function camelJoin(parts: string[]): string {
  return parts
    .map((p, i) => (i === 0 ? p : p[0]!.toUpperCase() + p.slice(1)))
    .join("");
}

// --- value-to-Kotlin helpers -------------------------------------------------

/** Kotlin `Float` literals always carry an `f` suffix. */
const kotlinFloat = (n: number): string => `${Number.isInteger(n) ? `${n}.0` : `${n}`}f`;

/** Convert any CSS Color 4 form parseable by `@polymorph/core.parseColor` to Compose `Color(0xFFRRGGBB)`. */
export function colorToKotlin(value: unknown): string | null {
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

/** dimension `{value, unit}` → Compose `Dp` (`16.dp`). `rem` is converted to px at a 16px base. */
export function dimToKotlin(value: unknown): string | null {
  if (!isDimension(value)) return null;
  const px = value.unit === "rem" ? value.value * 16 : value.value;
  return `${kotlinFloat(px)}.dp`;
}

/** Same shape as `dimToKotlin` but emits `TextUnit` (`16.sp`) for typography metrics. */
export function dimToKotlinSp(value: unknown): string | null {
  if (!isDimension(value)) return null;
  const px = value.unit === "rem" ? value.value * 16 : value.value;
  return `${kotlinFloat(px)}.sp`;
}

/** duration `{value, unit}` → Kotlin `Int` (milliseconds — Compose `tween(durationMillis = …)`). */
export function durationToKotlin(value: unknown): string | null {
  if (!isDimension(value)) return null;
  const ms = value.unit === "s" ? value.value * 1000 : value.value;
  return `${Math.round(ms)}`;
}

/** number → Kotlin `Float`. */
export function numberToKotlin(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value) ? kotlinFloat(value) : null;
}

/** cubicBezier `[x1,y1,x2,y2]` → Compose `CubicBezierEasing(...)`. */
export function cubicBezierToKotlin(value: unknown): string | null {
  if (!Array.isArray(value) || value.length !== 4 || !value.every((n) => typeof n === "number")) return null;
  return `CubicBezierEasing(${value.map((n) => kotlinFloat(n as number)).join(", ")})`;
}

const FONT_WEIGHTS: Record<number, string> = {
  100: "FontWeight.W100",
  200: "FontWeight.W200",
  300: "FontWeight.W300",
  400: "FontWeight.W400",
  500: "FontWeight.W500",
  600: "FontWeight.W600",
  700: "FontWeight.W700",
  800: "FontWeight.W800",
  900: "FontWeight.W900",
};
const WEIGHT_STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const nearestWeight = (n: number): string => {
  const w = WEIGHT_STEPS.reduce((best, step) => (Math.abs(step - n) < Math.abs(best - n) ? step : best), 400 as number);
  return FONT_WEIGHTS[w]!;
};

/** typography composite → `PolymorphTextStyle(...)` (helper data class emitted in the same file). */
export function typographyToKotlin(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const family = typeof o.fontFamily === "string" ? o.fontFamily : null;
  const weight = typeof o.fontWeight === "number" ? nearestWeight(o.fontWeight) : null;
  const size = dimToKotlinSp(o.fontSize);
  const lineHeight = typeof o.lineHeight === "number" ? kotlinFloat(o.lineHeight) : null;
  const tracking = dimToKotlinSp(o.letterSpacing);
  if (family === null || weight === null || size === null || lineHeight === null || tracking === null) return null;
  return [
    "PolymorphTextStyle(",
    `    fontFamily = "${family.replace(/"/g, '\\"')}",`,
    `    fontSize = ${size},`,
    `    fontWeight = ${weight},`,
    `    lineHeight = ${lineHeight},`,
    `    letterSpacing = ${tracking},`,
    "  )",
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

function singleShadowToKotlin(s: unknown): string | null {
  if (!s || typeof s !== "object") return null;
  const o = s as ShadowOne;
  const color = colorToKotlin(o.color);
  const x = dimToKotlin(o.offsetX);
  const y = dimToKotlin(o.offsetY);
  const blur = dimToKotlin(o.blur);
  if (!color || !x || !y || !blur) return null;
  const insetComment = o.inset === true ? " /* inset not supported by Compose shadow */" : "";
  return `PolymorphShadow(color = ${color}, x = ${x}, y = ${y}, radius = ${blur})${insetComment}`;
}

/** shadow (single object or array) → Kotlin `listOf(PolymorphShadow(...), ...)`. */
export function shadowToKotlin(value: unknown): string | null {
  const items = Array.isArray(value) ? value : [value];
  const out: string[] = [];
  for (const it of items) {
    const s = singleShadowToKotlin(it);
    if (s) out.push(s);
  }
  if (out.length === 0) return null;
  return `listOf(\n    ${out.join(",\n    ")},\n  )`;
}
