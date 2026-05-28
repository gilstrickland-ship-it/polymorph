import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { applyReducedMotion, resolveTheme, lintTheme } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const aurora = JSON.parse(
  readFileSync(join(here, "..", "..", "..", "examples", "mock-bank-aurora", "theme", "aurora.tokens.json"), "utf8"),
);

describe("applyReducedMotion", () => {
  const resolved = resolveTheme(aurora, "light");
  const clamped = applyReducedMotion(resolved);
  const reducedValue = resolved.tokens["pm.motion.duration.reduced"]!.value;
  const reducedEasing = resolved.tokens["pm.motion.easing.reduced"]!.value;

  it("clamps every motion duration to pm.motion.duration.reduced", () => {
    for (const id of ["pm.motion.duration.short", "pm.motion.duration.base", "pm.motion.duration.long"] as const) {
      expect(clamped.tokens[id]?.value).toEqual(reducedValue);
    }
    expect(clamped.tokens["pm.motion.duration.reduced"]?.value).toEqual(reducedValue);
  });

  it("clamps every easing to pm.motion.easing.reduced", () => {
    for (const id of ["pm.motion.easing.standard", "pm.motion.easing.emphasized"] as const) {
      expect(clamped.tokens[id]?.value).toEqual(reducedEasing);
    }
  });

  it("leaves non-motion tokens unchanged", () => {
    expect(clamped.tokens["pm.color.surface.base"]?.value).toEqual(resolved.tokens["pm.color.surface.base"]?.value);
    expect(clamped.tokens["pm.space.md"]?.value).toEqual(resolved.tokens["pm.space.md"]?.value);
  });

  it("is idempotent: applyReducedMotion(applyReducedMotion(x)) === applyReducedMotion(x)", () => {
    const twice = applyReducedMotion(clamped);
    expect(twice).toEqual(clamped);
  });

  it("does not mutate the input", () => {
    const before = JSON.stringify(resolved);
    applyReducedMotion(resolved);
    expect(JSON.stringify(resolved)).toBe(before);
  });

  it("defaults reduced easing to linear when pm.motion.easing.reduced is absent", () => {
    const stripped = {
      ...resolved,
      tokens: Object.fromEntries(
        Object.entries(resolved.tokens).filter(([k]) => k !== "pm.motion.easing.reduced"),
      ) as typeof resolved.tokens,
    };
    const out = applyReducedMotion(stripped);
    expect(out.tokens["pm.motion.easing.standard"]?.value).toEqual([0, 0, 1, 1]);
  });

  it("returns the input unchanged when pm.motion.duration.reduced is absent", () => {
    const stripped = {
      ...resolved,
      tokens: Object.fromEntries(
        Object.entries(resolved.tokens).filter(([k]) => k !== "pm.motion.duration.reduced"),
      ) as typeof resolved.tokens,
    };
    const out = applyReducedMotion(stripped);
    expect(out).toBe(stripped);
  });
});

describe("lint — MOTION_REDUCED_EXCEEDS_SHORT", () => {
  it("does not warn when reduced ≤ short", () => {
    const resolved = resolveTheme(aurora, "light");
    const warnings = lintTheme(resolved);
    expect(warnings.find((w) => w.code === "MOTION_REDUCED_EXCEEDS_SHORT")).toBeUndefined();
  });

  it("warns when reduced > short", () => {
    const resolved = resolveTheme(aurora, "light");
    const bad = {
      ...resolved,
      tokens: {
        ...resolved.tokens,
        "pm.motion.duration.reduced": { $type: "duration" as const, value: { value: 500, unit: "ms" } },
      },
    };
    const warnings = lintTheme(bad);
    const w = warnings.find((x) => x.code === "MOTION_REDUCED_EXCEEDS_SHORT");
    expect(w).toBeDefined();
    expect(w?.tokenIds).toEqual(["pm.motion.duration.reduced", "pm.motion.duration.short"]);
  });
});
