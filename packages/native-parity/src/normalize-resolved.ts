import type { ResolvedTheme, SemanticTokenId } from "@polymorph/spec";
import type { NormalizedSnapshot, NormalizedValue } from "./types.js";

/**
 * Convert a `ResolvedTheme` into the same `NormalizedSnapshot` shape the native parsers
 * produce. This is the runtime-parity baseline: every adapter (web CSS vars + the three
 * native codegens) is asserted equivalent to *this* snapshot, not to each other in
 * isolation. If a future adapter computes a value differently than core, runtime-parity
 * catches it before adapter goldens do.
 *
 * Keys match the native parsers' naming convention (camelCase id without the `pm.` prefix),
 * not the raw `pm.*` id, so `diffSnapshots` can compare across all four sources.
 */
export interface NormalizeOptions {
  /**
   * Include component-role flat constants (`buttonPrimaryBackground` etc.). Native adapters
   * emit these; the Web adapter currently doesn't (it expects component slots to consume
   * tokens directly through React props), so the Web parity check passes `false`.
   */
  includeComponents?: boolean;
}

export function normalizeResolved(rt: ResolvedTheme, opts: NormalizeOptions = {}): NormalizedSnapshot {
  const out: NormalizedSnapshot = new Map();
  for (const [id, tok] of Object.entries(rt.tokens) as [SemanticTokenId, { $type: string; value: unknown }][]) {
    const name = idToCamelName(id);
    const norm = normalizeValue(tok.$type, tok.value);
    if (norm) out.set(name, norm);
  }
  if (opts.includeComponents) {
    for (const [role, props] of Object.entries(rt.components ?? {}) as [string, Record<string, unknown> | undefined][]) {
      if (!props) continue;
      for (const [prop, value] of Object.entries(props)) {
        const name = roleToCamelName(role, prop);
        const norm = normalizeComponentValue(value);
        if (norm) out.set(name, norm);
      }
    }
  }
  return out;
}

/** `button.primary` + `background` → `buttonPrimaryBackground`. Matches the native adapters' flat name. */
export function roleToCamelName(role: string, property: string): string {
  const segs = role.split(".").concat(property);
  return segs.map((s, i) => (i === 0 ? s : s[0]!.toUpperCase() + s.slice(1))).join("");
}

/**
 * A component property's resolved value carries no `$type` — it's the raw value the adapter
 * codegen embeds. Infer the type by shape (same logic the adapter codegens already use
 * internally).
 */
function normalizeComponentValue(value: unknown): NormalizedValue | null {
  if (typeof value === "string") {
    if (/^#[0-9a-fA-F]{6,8}$/.test(value.trim())) return normalizeValue("color", value);
    return null;
  }
  if (typeof value === "number") return { kind: "number", n: value };
  if (Array.isArray(value)) {
    if (value.length === 4 && value.every((n) => typeof n === "number")) return normalizeValue("cubicBezier", value);
    // Shadow as array
    return normalizeValue("shadow", value);
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.unit === "string" && typeof o.value === "number") {
      return o.unit === "ms" || o.unit === "s" ? normalizeValue("duration", value) : normalizeValue("dimension", value);
    }
    // Typography composite
    if ("fontFamily" in o && "fontWeight" in o) return normalizeValue("typography", value);
    // Single shadow object
    if ("offsetX" in o && "blur" in o) return normalizeValue("shadow", value);
  }
  return null;
}

/** `pm.color.surface.base` → `colorSurfaceBase` — matches the three native parsers' keys. */
export function idToCamelName(id: string): string {
  return id
    .replace(/^pm\./, "")
    .split(".")
    .map((seg, i) => (i === 0 ? seg : seg[0]!.toUpperCase() + seg.slice(1)))
    .join("");
}

function normalizeValue($type: string, value: unknown): NormalizedValue | null {
  switch ($type) {
    case "color":
      if (typeof value !== "string") return null;
      return { kind: "color", hex: stripAlphaToLowerHex(value) };
    case "dimension":
      return normalizeDimension(value);
    case "duration":
      return normalizeDuration(value);
    case "number":
      return typeof value === "number" ? { kind: "number", n: value } : null;
    case "cubicBezier":
      if (!Array.isArray(value) || value.length !== 4) return null;
      return { kind: "cubicBezier", values: value as [number, number, number, number] };
    case "typography":
      return normalizeTypography(value);
    case "shadow":
      return normalizeShadow(value);
    default:
      return null;
  }
}

function stripAlphaToLowerHex(hex: string): string {
  // The native parsers compare 6-digit `#rrggbb`. Drop alpha if present.
  const m = /^#([0-9a-fA-F]{6,8})$/.exec(hex.trim());
  if (!m) return hex.toLowerCase();
  return ("#" + m[1]!.slice(0, 6)).toLowerCase();
}

function normalizeDimension(v: unknown): NormalizedValue | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.value !== "number") return null;
  // Match the native parsers' canonical px — convert `rem` (16px) / others as needed.
  switch (o.unit) {
    case "px":
      return { kind: "dimension", px: o.value };
    case "rem":
      return { kind: "dimension", px: o.value * 16 };
    case "em":
      return { kind: "dimension", px: o.value * 16 };
    default:
      return null;
  }
}

function normalizeDuration(v: unknown): NormalizedValue | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.value !== "number") return null;
  if (o.unit === "ms") return { kind: "duration", ms: o.value };
  if (o.unit === "s") return { kind: "duration", ms: o.value * 1000 };
  return null;
}

function normalizeTypography(v: unknown): NormalizedValue | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const family = o.fontFamily;
  const weight = o.fontWeight;
  const fontSize = o.fontSize as Record<string, unknown> | undefined;
  const lineHeight = o.lineHeight;
  const ls = o.letterSpacing as Record<string, unknown> | undefined;
  if (typeof family !== "string") return null;
  if (typeof weight !== "number") return null;
  if (!fontSize || typeof fontSize.value !== "number") return null;
  if (typeof lineHeight !== "number") return null;
  const letterSpacingPx = ls && typeof ls.value === "number" ? ls.value : 0;
  return {
    kind: "typography",
    family,
    weight,
    fontSizePx: fontSize.value,
    lineHeight,
    letterSpacingPx,
  };
}

function normalizeShadow(v: unknown): NormalizedValue | null {
  const list = Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
  const shadows: { hex: string; xPx: number; yPx: number; blurPx: number }[] = [];
  for (const s of list) {
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    const color = o.color;
    const ox = (o.offsetX as Record<string, unknown> | undefined)?.value;
    const oy = (o.offsetY as Record<string, unknown> | undefined)?.value;
    const bl = (o.blur as Record<string, unknown> | undefined)?.value;
    if (typeof color !== "string" || typeof ox !== "number" || typeof oy !== "number" || typeof bl !== "number") continue;
    shadows.push({ hex: stripAlphaToLowerHex(color), xPx: ox, yPx: oy, blurPx: bl });
  }
  if (shadows.length === 0) return null;
  return { kind: "shadow", shadows };
}
