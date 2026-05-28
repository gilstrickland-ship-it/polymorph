import { describe, it, expect } from "vitest";
import { resolveTheme } from "../src/resolve.js";
import { lintTheme } from "../src/lint.js";
import { validateTheme } from "../src/validate.js";
import { coreFixture, specFixture } from "./helpers.js";

const codes = (rt: ReturnType<typeof resolveTheme>) => lintTheme(rt).map((w) => w.code);

describe("lintTheme (advisory, WCAG 2.1)", () => {
  it("flags low body-text contrast, naming both tokens", () => {
    const rt = resolveTheme(coreFixture("low-contrast"), "light");
    const warnings = lintTheme(rt);
    const low = warnings.find((w) => w.code === "CONTRAST_TEXT_LOW");
    expect(low).toBeTruthy();
    expect(low!.tokenIds).toEqual(["pm.color.text.body", "pm.color.surface.base"]);
    expect(low!.threshold).toBe(4.5);
  });

  it("is non-blocking: a low-contrast theme is still valid", () => {
    expect(validateTheme(coreFixture("low-contrast")).valid).toBe(true);
  });

  it("does not flag adequate contrast", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.pm.modes.light.color.surface.base.$value = "#0b1020";
    theme.pm.modes.light.color.text.body.$value = "#ffffff";
    expect(codes(resolveTheme(theme, "light"))).not.toContain("CONTRAST_TEXT_LOW");
  });

  it("skips (not fails) genuinely unparseable colors (e.g. `currentColor`)", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.pm.modes.light.color.text.body.$value = "currentColor";
    theme.pm.modes.light.color.surface.base.$value = "#000000";
    expect(codes(resolveTheme(theme, "light"))).toContain("CONTRAST_SKIPPED_UNPARSEABLE");
  });

  it("evaluates modern CSS color forms (oklch / display-p3) rather than skipping", () => {
    // adequate contrast in oklch space → no CONTRAST_TEXT_LOW, no skip
    const ok = specFixture("valid", "minimal-light") as any;
    ok.pm.modes.light.color.surface.base.$value = "oklch(0.12 0.02 260)"; // near-black
    ok.pm.modes.light.color.text.body.$value = "oklch(0.97 0 0)";           // near-white
    const okCodes = codes(resolveTheme(ok, "light"));
    expect(okCodes).not.toContain("CONTRAST_TEXT_LOW");
    expect(okCodes).not.toContain("CONTRAST_SKIPPED_UNPARSEABLE");

    // poor contrast in display-p3 → CONTRAST_TEXT_LOW (so the new format actually flags real issues)
    const bad = specFixture("valid", "minimal-light") as any;
    bad.pm.modes.light.color.surface.base.$value = "color(display-p3 0.95 0.95 0.95)";
    bad.pm.modes.light.color.text.body.$value = "color(display-p3 0.85 0.85 0.85)";
    expect(codes(resolveTheme(bad, "light"))).toContain("CONTRAST_TEXT_LOW");
  });

  it("flags a too-small touch target", () => {
    // minimal-light uses 8px for all dimensions → below the 44px advisory minimum
    expect(codes(resolveTheme(specFixture("valid", "minimal-light"), "light"))).toContain("TOUCH_TARGET_SMALL");
  });
});
