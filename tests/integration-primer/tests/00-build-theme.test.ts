// Smoke: prove the Primer → Polymorph mapping yields a theme the contract accepts.
// Findings recorded in `wiki/01-Build-From-Primer.md`.

import { describe, it, expect } from "vitest";
import { validateTheme, resolveTheme } from "@polymorph/core";
import { buildPolymorphThemeFromPrimer } from "../src/build-theme.js";

describe("@primer/primitives → Polymorph theme", () => {
  const theme = buildPolymorphThemeFromPrimer(["light", "dark"]);

  it("validateTheme accepts the resulting theme", () => {
    const result = validateTheme(theme);
    if (!result.valid) {
      // Surfacing the first few errors makes the test self-documenting if Primer ships a
      // breaking minor that drops a CSS var we depend on.
      console.error(JSON.stringify(result.errors.slice(0, 5), null, 2));
    }
    expect(result.valid).toBe(true);
  });

  it("resolves to a non-trivial token count under both modes", () => {
    const light = resolveTheme(theme, "light");
    const dark = resolveTheme(theme, "dark");
    expect(Object.keys(light.tokens).length).toBeGreaterThan(50);
    expect(Object.keys(dark.tokens).length).toBeGreaterThan(50);
  });

  it("carries Primer's actual brand identity (green primary, dark body text)", () => {
    const light = resolveTheme(theme, "light");
    // Primer 11.x ships #1f883d as the success-emphasis green; the FI mapping uses it for
    // our primary action because the GitHub product visually treats success-green as primary.
    expect(light.tokens["pm.color.action.primary.rest"]?.value).toBe("#1f883d");
    // GitHub's near-black body text.
    expect(light.tokens["pm.color.text.body"]?.value).toBe("#1f2328");
  });

  it("typography composite carries Primer's Mona Sans stack", () => {
    const light = resolveTheme(theme, "light");
    const body = light.tokens["pm.typography.body"]?.value as { fontFamily: string };
    expect(body.fontFamily).toContain("Mona Sans");
  });
});
