import type { ResolvedTheme } from "@polymorph/spec";
import type { LintWarning } from "./errors.js";
import { contrastRatio } from "./contrast.js";

const round2 = (n: number): number => Math.round(n * 100) / 100;

function value(rt: ResolvedTheme, id: string): unknown {
  return (rt.tokens as Record<string, { value: unknown } | undefined>)[id]?.value;
}

function contrastRule(
  rt: ResolvedTheme,
  fgId: string,
  bgId: string,
  code: "CONTRAST_TEXT_LOW" | "CONTRAST_ON_ACTION_LOW",
  out: LintWarning[],
): void {
  const fg = value(rt, fgId);
  const bg = value(rt, bgId);
  if (typeof fg !== "string" || typeof bg !== "string") return; // missing inputs → skip
  let ratio: number;
  try {
    ratio = contrastRatio(fg, bg);
  } catch {
    out.push({
      code: "CONTRAST_SKIPPED_UNPARSEABLE",
      message: `contrast not evaluated for ${fgId} on ${bgId}: unsupported color format`,
      tokenIds: [fgId, bgId],
      measured: 0,
      threshold: 4.5,
    });
    return;
  }
  if (ratio < 4.5) {
    out.push({
      code,
      message: `${fgId} on ${bgId} has contrast ${round2(ratio)}:1, below 4.5:1`,
      tokenIds: [fgId, bgId],
      measured: round2(ratio),
      threshold: 4.5,
    });
  }
}

/** Advisory WCAG 2.1 lint over a resolved theme. Returns warnings; never throws, never blocks. */
export function lintTheme(rt: ResolvedTheme): LintWarning[] {
  const out: LintWarning[] = [];

  contrastRule(rt, "pm.color.text.body", "pm.color.surface.base", "CONTRAST_TEXT_LOW", out);
  contrastRule(rt, "pm.color.text.onAction", "pm.color.action.primary.rest", "CONTRAST_ON_ACTION_LOW", out);

  const touch = value(rt, "pm.size.touchTarget.min");
  if (touch && typeof touch === "object" && "value" in touch && "unit" in touch) {
    const t = touch as { value: number; unit: string };
    if (t.unit === "px" && typeof t.value === "number" && t.value < 44) {
      out.push({
        code: "TOUCH_TARGET_SMALL",
        message: `pm.size.touchTarget.min is ${t.value}px, below the 44px advisory minimum`,
        tokenIds: ["pm.size.touchTarget.min"],
        measured: t.value,
        threshold: 44,
      });
    }
  }

  const opacity = value(rt, "pm.opacity.disabled");
  if (typeof opacity === "number" && opacity > 0.6) {
    out.push({
      code: "DISABLED_OPACITY_HIGH",
      message: `pm.opacity.disabled is ${opacity}, above the 0.6 advisory maximum`,
      tokenIds: ["pm.opacity.disabled"],
      measured: opacity,
      threshold: 0.6,
    });
  }

  return out;
}
