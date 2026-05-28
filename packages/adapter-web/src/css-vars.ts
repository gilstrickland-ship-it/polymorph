// Framework-agnostic web core: emit a ResolvedTheme as CSS custom properties.
// A semantic id like `pm.color.surface.base` becomes the CSS variable
// `--pm-color-surface-base`. Typography composites expand into one variable per
// sub-property (font-family / font-weight / font-size / line-height / letter-spacing).

import { applyReducedMotion } from "@polymorph/core";
import type { ResolvedTheme, SemanticTokenId } from "@polymorph/spec";

/** `pm.color.surface.base` → `--pm-color-surface-base` */
export function toCssVarName(id: SemanticTokenId): string {
  return `--${id.replace(/\./g, "-")}`;
}

const dim = (v: unknown): string | null => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "value" in v && "unit" in v) {
    const o = v as { value: number; unit: string };
    return `${o.value}${o.unit}`;
  }
  return null;
};

function shadowToCss(v: unknown): string | null {
  if (Array.isArray(v)) {
    const parts = v.map(shadowToCss).filter((x): x is string => x !== null);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  if (!v || typeof v !== "object") return null;
  const s = v as { color?: unknown; offsetX?: unknown; offsetY?: unknown; blur?: unknown; spread?: unknown; inset?: unknown };
  const ox = dim(s.offsetX);
  const oy = dim(s.offsetY);
  const bl = dim(s.blur);
  const sp = dim(s.spread);
  if (!ox || !oy || !bl || !sp || typeof s.color !== "string") return null;
  const inset = s.inset === true ? "inset " : "";
  return `${inset}${ox} ${oy} ${bl} ${sp} ${s.color}`;
}

/**
 * Convert a single resolved token's `($type, value)` pair into one or more CSS variable
 * entries. Typography returns 5 entries (sub-properties); everything else returns 1.
 */
export function toCssEntries(id: SemanticTokenId, $type: string, value: unknown): [string, string][] {
  const name = toCssVarName(id);

  switch ($type) {
    case "color":
      return typeof value === "string" ? [[name, value]] : [];
    case "dimension":
    case "duration": {
      const d = dim(value);
      return d !== null ? [[name, d]] : [];
    }
    case "number":
      return typeof value === "number" ? [[name, String(value)]] : [];
    case "cubicBezier":
      if (Array.isArray(value) && value.length === 4 && value.every((n) => typeof n === "number")) {
        return [[name, `cubic-bezier(${value.join(", ")})`]];
      }
      return [];
    case "shadow": {
      const css = shadowToCss(value);
      return css !== null ? [[name, css]] : [];
    }
    case "typography": {
      if (!value || typeof value !== "object") return [];
      const o = value as Record<string, unknown>;
      const out: [string, string][] = [];
      const ff = o.fontFamily;
      const fw = o.fontWeight;
      const fs = dim(o.fontSize);
      const lh = o.lineHeight;
      const ls = dim(o.letterSpacing);
      if (typeof ff === "string") out.push([`${name}-font-family`, ff]);
      if (typeof fw === "string" || typeof fw === "number") out.push([`${name}-font-weight`, String(fw)]);
      if (fs !== null) out.push([`${name}-font-size`, fs]);
      if (typeof lh === "number" || typeof lh === "string") out.push([`${name}-line-height`, String(lh)]);
      if (ls !== null) out.push([`${name}-letter-spacing`, ls]);
      return out;
    }
    default:
      return [];
  }
}

/** A `ResolvedTheme` flattened to a CSS-variable record, ready to inject. */
export function toCssVariables(resolved: ResolvedTheme): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, token] of Object.entries(resolved.tokens)) {
    if (!token) continue;
    for (const [k, v] of toCssEntries(id as SemanticTokenId, token.$type, token.value)) {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Render the CSS-variable record as a stylesheet body. The default selector is `:root` (global
 * theme); pass a class/id (e.g. `.aurora`) to scope a theme to a subtree.
 *
 * When `reducedMotion: "media"` (default), emits a sibling
 * `@media (prefers-reduced-motion: reduce)` block that overrides every motion duration +
 * easing variable to the reduced-motion clamp. Pass `"off"` to skip the block (orgs that
 * apply the clamp in JS via `applyReducedMotion` don't need the CSS doubling).
 */
export function toCssVariablesString(
  resolved: ResolvedTheme,
  selector: string = ":root",
  opts: { reducedMotion?: "media" | "off" } = {},
): string {
  const vars = toCssVariables(resolved);
  const body = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  const main = `${selector} {\n${body}\n}`;
  if ((opts.reducedMotion ?? "media") === "off") return main;
  return `${main}\n\n${toReducedMotionMediaBlock(resolved, selector)}`;
}

/**
 * Render just the `@media (prefers-reduced-motion: reduce)` block. The block ONLY contains
 * the variables that change under the clamp — motion durations + easings — so the cascade
 * stays minimal. Exposed separately so adapters that ship their own stylesheet shell can
 * stitch it in themselves.
 */
export function toReducedMotionMediaBlock(resolved: ResolvedTheme, selector: string = ":root"): string {
  const clamped = applyReducedMotion(resolved);
  const before = toCssVariables(resolved);
  const after = toCssVariables(clamped);
  const diff: [string, string][] = [];
  for (const [k, v] of Object.entries(after)) {
    if (before[k] !== v) diff.push([k, v]);
  }
  if (diff.length === 0) return "";
  const body = diff.map(([k, v]) => `    ${k}: ${v};`).join("\n");
  return `@media (prefers-reduced-motion: reduce) {\n  ${selector} {\n${body}\n  }\n}`;
}
