// Specs 016 + 026 — every adapter consumes the resolved theme; runtime parity asserts
// they all agree with the core baseline. Findings: wiki/03-Adapter-Coverage.md.

import { describe, it, expect } from "vitest";
import { resolveTheme } from "@polymorph/core";
import { toCssVariables, toCssVariablesString } from "@polymorph/adapter-web";
import { transformToDart } from "@polymorph/adapter-flutter";
import { transformToSwift } from "@polymorph/adapter-swift";
import { transformToKotlin } from "@polymorph/adapter-kotlin";
import { checkRuntimeParity } from "@polymorph/native-parity";
import { buildPolymorphThemeFromPrimer } from "../src/build-theme.js";

const theme = buildPolymorphThemeFromPrimer(["light", "dark"]);

describe("Adapter codegen against Primer-derived theme", () => {
  it("Web (CSS vars) emits a non-trivial CSS-vars record", () => {
    const rt = resolveTheme(theme, "light");
    const vars = toCssVariables(rt);
    expect(Object.keys(vars).length).toBeGreaterThan(50);
    // Brand colour must reach the CSS output.
    expect(vars["--pm-color-action-primary-rest"]).toBe("#1f883d");
  });

  it("Web stylesheet wraps under :root + emits the @media (prefers-reduced-motion) block", () => {
    const rt = resolveTheme(theme, "light");
    const css = toCssVariablesString(rt);
    expect(css).toContain(":root {");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("Dart codegen emits valid-looking source carrying Primer's brand green", () => {
    const dart = transformToDart(theme, { mode: "light", className: "GitHubThemeLight" });
    expect(dart).toContain("class GitHubThemeLight");
    expect(dart).toContain("0xFF1F883D"); // primary rest in Dart format
  });

  it("Swift codegen emits Primer brand green with 0.122/0.533/0.239 channels", () => {
    const swift = transformToSwift(theme, { mode: "light", enumName: "GitHubThemeLight" });
    expect(swift).toContain("enum GitHubThemeLight");
    // 0x1F = 31 → 31/255 ≈ 0.1216, 0x88 = 136/255 ≈ 0.5333, 0x3D = 61/255 ≈ 0.2392
    expect(swift).toMatch(/red:\s*0\.121/);
  });

  it("Kotlin codegen emits Primer brand green", () => {
    const kt = transformToKotlin(theme, { mode: "light", objectName: "GitHubThemeLight" });
    expect(kt).toContain("object GitHubThemeLight");
    expect(kt).toContain("0xFF1F883D");
  });
});

describe("Spec 026 — runtime parity across every adapter against core baseline", () => {
  for (const mode of ["light", "dark"] as const) {
    it(`${mode}: every adapter agrees with the core resolved baseline`, () => {
      const results = checkRuntimeParity(theme, mode);
      const failing = results.filter((r) => r.mismatches.length > 0);
      if (failing.length > 0) {
        for (const f of failing) {
          console.error(
            `[parity:${mode}] ${f.adapter}:\n` +
              f.mismatches
                .slice(0, 3)
                .map((m) => `  - ${m.name}: ${JSON.stringify(m.left)} vs ${JSON.stringify(m.right)}`)
                .join("\n"),
          );
        }
      }
      expect(failing.length).toBe(0);
    });
  }
});
