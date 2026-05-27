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

  it("skips (not fails) unparseable colors", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.pm.modes.light.color.text.body.$value = "oklch(0.7 0.1 200)";
    theme.pm.modes.light.color.surface.base.$value = "#000000";
    expect(codes(resolveTheme(theme, "light"))).toContain("CONTRAST_SKIPPED_UNPARSEABLE");
  });

  it("flags a too-small touch target", () => {
    // minimal-light uses 8px for all dimensions → below the 44px advisory minimum
    expect(codes(resolveTheme(specFixture("valid", "minimal-light"), "light"))).toContain("TOUCH_TARGET_SMALL");
  });
});
