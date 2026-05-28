// Reduced-motion clamp.
//
// When the host signals `prefers-reduced-motion: reduce`, every motion-related token in a
// resolved theme collapses to a single pair of values: the FI's authored `pm.motion.duration.reduced`
// and `pm.motion.easing.reduced` (defaults to linear if the FI didn't author it). This is a
// pure transform — no I/O, no DOM access. The host runs it; adapters consume the result.
//
// We clamp at the resolved-theme layer (not at validate / not at codegen) because:
//  - Validate runs once per theme; the reduced-motion preference flips at runtime per user.
//  - Codegen / adapters operate on `ResolvedTheme`; flipping the input is symmetric with
//    flipping `mode`.
//  - The native parity package already exercises `ResolvedTheme` round-trips, so the
//    transform is automatically covered cross-platform.

import type { ResolvedTheme, SemanticTokenId } from "@polymorph/spec";

const LINEAR: readonly [number, number, number, number] = [0, 0, 1, 1];

const DURATION_PREFIX = "pm.motion.duration.";
const EASING_PREFIX = "pm.motion.easing.";
const REDUCED_DURATION = "pm.motion.duration.reduced" as SemanticTokenId;
const REDUCED_EASING = "pm.motion.easing.reduced" as SemanticTokenId;

/**
 * Return a new `ResolvedTheme` with every motion duration replaced by the value at
 * `pm.motion.duration.reduced` and every motion easing replaced by the value at
 * `pm.motion.easing.reduced` (or linear `[0,0,1,1]` if absent).
 *
 * Idempotent — calling twice yields the same theme. Component blocks are walked and any
 * property whose value structurally matches a motion duration or cubicBezier is replaced
 * too; this keeps adapter codegen consistent without the adapter needing to know which
 * component slots are motion-typed.
 *
 * Does NOT mutate the input. Returns the input unchanged if `pm.motion.duration.reduced` is
 * missing (which is a contract-validation error caught elsewhere — this transform is
 * intentionally non-throwing so it's safe to call on partial themes during development).
 */
export function applyReducedMotion(theme: ResolvedTheme): ResolvedTheme {
  const reducedDuration = theme.tokens[REDUCED_DURATION]?.value;
  if (reducedDuration === undefined) return theme;
  const reducedEasing = theme.tokens[REDUCED_EASING]?.value ?? LINEAR;

  const nextTokens: ResolvedTheme["tokens"] = { ...theme.tokens };
  for (const [id, token] of Object.entries(theme.tokens) as [SemanticTokenId, NonNullable<typeof theme.tokens[SemanticTokenId]>][]) {
    if (token.$type === "duration" && id.startsWith(DURATION_PREFIX)) {
      nextTokens[id] = { $type: "duration", value: reducedDuration };
    } else if (token.$type === "cubicBezier" && id.startsWith(EASING_PREFIX)) {
      nextTokens[id] = { $type: "cubicBezier", value: reducedEasing };
    }
  }

  const nextComponents: ResolvedTheme["components"] = {};
  for (const [role, props] of Object.entries(theme.components)) {
    if (!props) continue;
    const swapped: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) {
      swapped[k] = replaceMotionValue(v, reducedDuration, reducedEasing);
    }
    nextComponents[role as keyof ResolvedTheme["components"]] = swapped;
  }

  return { ...theme, tokens: nextTokens, components: nextComponents };
}

function replaceMotionValue(v: unknown, reducedDuration: unknown, reducedEasing: unknown): unknown {
  if (isDurationLike(v)) return reducedDuration;
  if (isCubicBezierLike(v)) return reducedEasing;
  return v;
}

function isDurationLike(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return o.unit === "ms" && typeof o.value === "number";
}

function isCubicBezierLike(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length === 4 &&
    v.every((n) => typeof n === "number")
  );
}
