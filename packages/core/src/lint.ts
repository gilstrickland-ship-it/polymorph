import { TOKENS, COMPONENT_ROLES, type ThemeMode } from "@polymorph/spec";
import type { LintWarning, LintCode } from "./errors.js";
import { contrastRatio } from "./contrast.js";
import { resolveTheme } from "./resolve.js";
import { declaredModes } from "./resolve.js";

const round2 = (n: number): number => Math.round(n * 100) / 100;

// WCAG 2.1 thresholds. Per SC 1.4.3 (text contrast): normal text 4.5:1, large text 3:1.
// Per SC 1.4.11 (non-text contrast): UI components + graphical objects 3:1.
const AA_TEXT = 4.5;
const AA_LARGE = 3.0;
const AA_NON_TEXT = 3.0;

// --- helpers -----------------------------------------------------------------

type RT = ReturnType<typeof resolveTheme>;

const tokensByGroup = (group: string): string[] =>
  TOKENS.filter((t) => t.group === group && t.type === "color").map((t) => t.id);

const valueAt = (rt: RT, id: string): unknown =>
  (rt.tokens as Record<string, { value: unknown } | undefined>)[id]?.value;

const componentValueAt = (rt: RT, role: string, property: string): unknown =>
  (rt.components as Record<string, Record<string, unknown> | undefined>)[role]?.[property];

interface PairResult {
  ratio: number | null; // null when at least one side is unparseable or missing
  unparseable: boolean;
}

function evaluatePair(fg: unknown, bg: unknown): PairResult {
  if (typeof fg !== "string" || typeof bg !== "string") return { ratio: null, unparseable: false };
  try {
    return { ratio: contrastRatio(fg, bg), unparseable: false };
  } catch {
    return { ratio: null, unparseable: true };
  }
}

function pushBelow(
  out: LintWarning[],
  code: LintCode,
  fgId: string,
  bgId: string,
  pair: PairResult,
  threshold: number,
  describe: string,
): void {
  if (pair.unparseable) {
    out.push({
      code: "CONTRAST_SKIPPED_UNPARSEABLE",
      message: `contrast not evaluated for ${fgId} on ${bgId}: unsupported color format`,
      tokenIds: [fgId, bgId],
      measured: 0,
      threshold,
    });
    return;
  }
  if (pair.ratio === null) return; // one side missing — skip silently (validate catches required gaps)
  if (pair.ratio < threshold) {
    out.push({
      code,
      message: `${describe} (${fgId} on ${bgId}) has contrast ${round2(pair.ratio)}:1, below ${threshold}:1`,
      tokenIds: [fgId, bgId],
      measured: round2(pair.ratio),
      threshold,
    });
  }
}

function pushComponentBelow(
  out: LintWarning[],
  role: string,
  fgProp: string,
  bgProp: string,
  pair: PairResult,
  threshold: number,
): void {
  const ids = [`${role}.${fgProp}`, `${role}.${bgProp}`];
  if (pair.unparseable) {
    out.push({
      code: "CONTRAST_SKIPPED_UNPARSEABLE",
      message: `contrast not evaluated for ${ids[0]} on ${ids[1]}: unsupported color format`,
      tokenIds: ids,
      measured: 0,
      threshold,
    });
    return;
  }
  if (pair.ratio === null) return;
  if (pair.ratio < threshold) {
    out.push({
      code: "COMPONENT_CONTRAST_LOW",
      message: `component ${role}: ${fgProp} on ${bgProp} has contrast ${round2(pair.ratio)}:1, below ${threshold}:1`,
      tokenIds: ids,
      measured: round2(pair.ratio),
      threshold,
    });
  }
}

// --- rule sets ---------------------------------------------------------------

function lintTextSurfaceMatrix(rt: RT, out: LintWarning[]): void {
  // Body / muted / link / disabled text on every surface in scope.
  // `disabled` is allowed AA Large (3:1); the rest require AA (4.5:1).
  const surfaces = tokensByGroup("color.surface").filter((id) => id !== "pm.color.surface.inverse");
  const textRules: { id: string; code: LintCode; threshold: number }[] = [
    { id: "pm.color.text.body", code: "CONTRAST_TEXT_LOW", threshold: AA_TEXT },
    { id: "pm.color.text.muted", code: "CONTRAST_TEXT_LOW", threshold: AA_TEXT },
    { id: "pm.color.text.link", code: "CONTRAST_TEXT_LOW", threshold: AA_TEXT },
    { id: "pm.color.text.disabled", code: "DISABLED_TEXT_LOW", threshold: AA_LARGE },
  ];
  for (const t of textRules) {
    for (const s of surfaces) {
      const pair = evaluatePair(valueAt(rt, t.id), valueAt(rt, s));
      pushBelow(out, t.code, t.id, s, pair, t.threshold, "text");
    }
  }
}

function lintOnActionMatrix(rt: RT, out: LintWarning[]): void {
  // `text.onAction` on every actionable background EXCEPT *.disabled (disabled actions are
  // intentionally low-contrast affordances; covered by DISABLED_TEXT_LOW elsewhere if needed).
  const onAction = "pm.color.text.onAction";
  const actionBgs = TOKENS.filter(
    (t) =>
      t.type === "color" &&
      (t.group === "color.action.primary" || t.group === "color.action.secondary" || t.group === "color.action.danger") &&
      !t.id.endsWith(".disabled"),
  ).map((t) => t.id);
  for (const bg of actionBgs) {
    const pair = evaluatePair(valueAt(rt, onAction), valueAt(rt, bg));
    pushBelow(out, "CONTRAST_ON_ACTION_LOW", onAction, bg, pair, AA_TEXT, "actionable text");
  }
}

function lintOnInverse(rt: RT, out: LintWarning[]): void {
  const pair = evaluatePair(valueAt(rt, "pm.color.text.onInverse"), valueAt(rt, "pm.color.surface.inverse"));
  pushBelow(out, "CONTRAST_ON_INVERSE_LOW", "pm.color.text.onInverse", "pm.color.surface.inverse", pair, AA_TEXT, "inverse-surface text");
}

function lintFeedbackOnSurface(rt: RT, out: LintWarning[]): void {
  // Feedback accents must be legible as inline text on the base surface (SC 1.4.3).
  const base = "pm.color.surface.base";
  for (const id of tokensByGroup("color.feedback")) {
    const pair = evaluatePair(valueAt(rt, id), valueAt(rt, base));
    pushBelow(out, "CONTRAST_FEEDBACK_LOW", id, base, pair, AA_TEXT, "feedback text");
  }
}

function lintFocusAndBorder(rt: RT, out: LintWarning[]): void {
  const base = "pm.color.surface.base";
  const focusPair = evaluatePair(valueAt(rt, "pm.color.border.focus"), valueAt(rt, base));
  pushBelow(out, "FOCUS_RING_LOW", "pm.color.border.focus", base, focusPair, AA_NON_TEXT, "focus ring");
  const borderPair = evaluatePair(valueAt(rt, "pm.color.border.default"), valueAt(rt, base));
  pushBelow(out, "BORDER_DEFAULT_LOW", "pm.color.border.default", base, borderPair, AA_NON_TEXT, "default border");
}

function lintComponentPairs(rt: RT, out: LintWarning[]): void {
  // For every component role that declares both a `foreground` (or `border`) and a `background`,
  // check the contrast of the resolved (override-applied) values. Threshold 4.5 for foreground
  // text; 3 for borders.
  for (const role of COMPONENT_ROLES) {
    const props = new Set(role.properties.map((p) => p.property));
    if (props.has("foreground") && props.has("background")) {
      const fg = componentValueAt(rt, role.role, "foreground");
      const bg = componentValueAt(rt, role.role, "background");
      pushComponentBelow(out, role.role, "foreground", "background", evaluatePair(fg, bg), AA_TEXT);
    }
    if (props.has("border") && props.has("background") && !props.has("foreground")) {
      // A bordered-only role (e.g. a tag) — the border must distinguish itself from the bg.
      const border = componentValueAt(rt, role.role, "border");
      const bg = componentValueAt(rt, role.role, "background");
      pushComponentBelow(out, role.role, "border", "background", evaluatePair(border, bg), AA_NON_TEXT);
    }
  }
}

function lintTouchTarget(rt: RT, out: LintWarning[]): void {
  const touch = valueAt(rt, "pm.size.touchTarget.min");
  if (!touch || typeof touch !== "object" || !("value" in touch) || !("unit" in touch)) return;
  const t = touch as { value: number; unit: string };
  if (t.unit !== "px" || typeof t.value !== "number") return;
  if (t.value < 44) {
    out.push({
      code: "TOUCH_TARGET_SMALL",
      message: `pm.size.touchTarget.min is ${t.value}px, below the 44px advisory minimum`,
      tokenIds: ["pm.size.touchTarget.min"],
      measured: t.value,
      threshold: 44,
    });
  }
}

function lintDisabledOpacity(rt: RT, out: LintWarning[]): void {
  const opacity = valueAt(rt, "pm.opacity.disabled");
  if (typeof opacity === "number" && opacity > 0.6) {
    out.push({
      code: "DISABLED_OPACITY_HIGH",
      message: `pm.opacity.disabled is ${opacity}, above the 0.6 advisory maximum`,
      tokenIds: ["pm.opacity.disabled"],
      measured: opacity,
      threshold: 0.6,
    });
  }
}

function lintMotionDuration(rt: RT, out: LintWarning[]): void {
  // Long motion can be disorienting (WCAG 2.3 Three Flashes and animation guidance). Anything
  // above 500ms for the base duration is flagged advisory; large transitions should be
  // user-initiated, not the default for in-flow UI.
  const base = valueAt(rt, "pm.motion.duration.base");
  if (!base || typeof base !== "object" || !("value" in base) || !("unit" in base)) return;
  const d = base as { value: number; unit: string };
  if (typeof d.value !== "number") return;
  const ms = d.unit === "s" ? d.value * 1000 : d.value;
  if (ms > 500) {
    out.push({
      code: "MOTION_BASE_LONG",
      message: `pm.motion.duration.base is ${ms}ms, above the 500ms advisory maximum`,
      tokenIds: ["pm.motion.duration.base"],
      measured: ms,
      threshold: 500,
    });
  }
}

// --- public API --------------------------------------------------------------

/**
 * Advisory WCAG 2.1 lint over a resolved theme. Returns warnings; never throws, never blocks.
 *
 * Rule families (v2):
 *  - Text contrast on every named surface (body / muted / link, AA 4.5; disabled, AA Large 3.0)
 *  - `onAction` on every actionable background (rest / hover / pressed across primary, secondary, danger)
 *  - `onInverse` on `surface.inverse`
 *  - Feedback accents (`success`/`warning`/`error`/`info`) legibility on `surface.base`
 *  - Focus ring + default border visibility on `surface.base` (non-text 3:1)
 *  - Per-component `foreground`-on-`background` (text 4.5) and `border`-on-`background` (3:1)
 *  - Touch-target ≥ 44px; disabled-opacity ≤ 0.6; base motion duration ≤ 500ms
 *
 * Backwards-compatible: existing codes (`CONTRAST_TEXT_LOW`, `CONTRAST_ON_ACTION_LOW`,
 * `TOUCH_TARGET_SMALL`, `DISABLED_OPACITY_HIGH`, `CONTRAST_SKIPPED_UNPARSEABLE`) still fire on
 * the same conditions as before; new families add additional codes.
 */
export function lintTheme(rt: RT): LintWarning[] {
  const out: LintWarning[] = [];
  lintTextSurfaceMatrix(rt, out);
  lintOnActionMatrix(rt, out);
  lintOnInverse(rt, out);
  lintFeedbackOnSurface(rt, out);
  lintFocusAndBorder(rt, out);
  lintComponentPairs(rt, out);
  lintTouchTarget(rt, out);
  lintDisabledOpacity(rt, out);
  lintMotionDuration(rt, out);
  return out;
}

/**
 * Convenience: lint a theme across every mode it declares (via `declaredModes`) and tag each
 * warning with the mode it surfaced in. Useful for CI gates that want one `lint --strict`
 * pass to cover the whole theme.
 */
export function lintAllModes(theme: unknown): { mode: ThemeMode; warnings: LintWarning[] }[] {
  const modes = declaredModes(theme);
  return modes.map((mode) => ({ mode, warnings: lintTheme(resolveTheme(theme, mode)) }));
}
