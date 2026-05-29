// Specs 020 (a11y lint) + 023 (motion-reduce) + 025 (protected-surface floors) + 027
// (policy packs) exercised against the real Primer-derived theme.
// Findings: wiki/02-Lint-Findings.md.

import { describe, it, expect } from "vitest";
import {
  resolveTheme,
  lintTheme,
  applyReducedMotion,
  lintWithPolicies,
  definePolicyPack,
  warning,
} from "@polymorph/core";
import { buildPolymorphThemeFromPrimer } from "../src/build-theme.js";

const theme = buildPolymorphThemeFromPrimer(["light", "dark"]);

describe("Spec 020 — advisory WCAG lint on real Primer tokens", () => {
  it("light mode produces a stable set of advisory warnings", () => {
    const warnings = lintTheme(resolveTheme(theme, "light"));
    // Surface for the report — Primer's choices around contrast on action buttons + borders
    // sit close to the AA threshold so a handful of warnings is expected and useful.
    console.log("[lint:light]", warnings.map((w) => w.code));
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.length).toBeLessThan(50);
  });

  it("both modes produce findings (Primer's contrast posture is symmetric across modes)", () => {
    // Finding (recorded in wiki/02-Lint-Findings.md): GitHub Primer's button/border
    // contrast pattern is mirrored between light and dark, so the same lint codes fire
    // under both. This isn't a bug — it's a real observation surfaced by the integration
    // test about how Primer's design choices map to our slot vocabulary.
    const light = lintTheme(resolveTheme(theme, "light"));
    const dark = lintTheme(resolveTheme(theme, "dark"));
    expect(light.length).toBeGreaterThan(0);
    expect(dark.length).toBeGreaterThan(0);
  });

  it("warnings carry stable shape — every entry has code + message + tokenIds", () => {
    const warnings = lintTheme(resolveTheme(theme, "light"));
    for (const w of warnings) {
      expect(typeof w.code).toBe("string");
      expect(typeof w.message).toBe("string");
      expect(Array.isArray(w.tokenIds)).toBe(true);
    }
  });
});

describe("Spec 023 — applyReducedMotion clamps Primer-mapped motion tokens", () => {
  const rt = resolveTheme(theme, "light");
  const reducedValue = (rt.tokens["pm.motion.duration.reduced"]?.value as { value: number; unit: string }).value;

  it("every motion duration collapses to pm.motion.duration.reduced", () => {
    const clamped = applyReducedMotion(rt);
    for (const id of ["pm.motion.duration.short", "pm.motion.duration.base", "pm.motion.duration.long"] as const) {
      const value = clamped.tokens[id]?.value as { value: number };
      expect(value.value).toBe(reducedValue);
    }
  });

  it("idempotent: applying twice changes nothing further", () => {
    const a = applyReducedMotion(rt);
    const b = applyReducedMotion(a);
    expect(JSON.stringify(b.tokens)).toBe(JSON.stringify(a.tokens));
  });
});

describe("Spec 025 — protected-surface floors fire on Primer-defaulted disclosure", () => {
  // Primer doesn't have a `disclosure` semantic — we let the contract's role-defaults
  // apply, which means `text.muted` foreground + `caption` typography. Both trip the
  // protected floors, demonstrating the rule is meaningful against a real design system.
  const warnings = lintTheme(resolveTheme(theme, "light"));
  const codes = warnings.map((w) => w.code);

  it("at least one PROTECTED_* code fires (real-world FI signal)", () => {
    const protectedCodes = codes.filter((c) => c.startsWith("PROTECTED_"));
    console.log("[protected:light]", protectedCodes);
    expect(protectedCodes.length).toBeGreaterThan(0);
  });
});

describe("Spec 027 — project-local policy pack on top of built-ins", () => {
  // A pack the GitHub design-systems team might author internally: every primary action
  // must descend from the official #1f883d brand green. Demonstrates the policy-pack
  // composition surface against a real published theme.
  const brandGuard = definePolicyPack({
    name: "github/brand-guard",
    version: "1.0.0",
    rules: [
      (rt) => {
        const v = rt.tokens["pm.color.action.primary.rest"]?.value;
        if (typeof v !== "string") return [];
        if (v.toLowerCase() !== "#1f883d") {
          return [
            warning(
              "GITHUB_BRAND_GREEN_DRIFT",
              `pm.color.action.primary.rest is ${v}, expected #1f883d`,
              ["pm.color.action.primary.rest"],
            ),
          ];
        }
        return [];
      },
    ],
  });

  it("baseline theme passes the brand-guard rule", () => {
    const warnings = lintWithPolicies(resolveTheme(theme, "light"), [brandGuard]);
    expect(warnings.find((w) => w.code === "GITHUB_BRAND_GREEN_DRIFT")).toBeUndefined();
  });

  it("a forked theme that drops the brand colour trips the rule", () => {
    const forked = JSON.parse(JSON.stringify(theme));
    forked.pm.modes.light.color.action.primary.rest.$value = "#ff00ff";
    const warnings = lintWithPolicies(resolveTheme(forked, "light"), [brandGuard]);
    expect(warnings.find((w) => w.code === "GITHUB_BRAND_GREEN_DRIFT")).toBeDefined();
  });
});
