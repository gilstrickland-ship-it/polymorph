import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveTheme } from "@polymorph/core";
import { toCssVariablesString, toReducedMotionMediaBlock } from "../src/css-vars.js";

const here = dirname(fileURLToPath(import.meta.url));
const aurora = JSON.parse(
  readFileSync(join(here, "..", "..", "..", "examples", "mock-bank-aurora", "theme", "aurora.tokens.json"), "utf8"),
);

describe("toReducedMotionMediaBlock", () => {
  const resolved = resolveTheme(aurora, "light");

  it("emits a @media (prefers-reduced-motion: reduce) block with only motion overrides", () => {
    const block = toReducedMotionMediaBlock(resolved);
    expect(block).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    // motion variables present
    expect(block).toContain("--pm-motion-duration-short");
    expect(block).toContain("--pm-motion-duration-base");
    expect(block).toContain("--pm-motion-easing-standard");
    // non-motion variables NOT present
    expect(block).not.toContain("--pm-color-surface-base");
    expect(block).not.toContain("--pm-space-md");
  });

  it("respects a custom selector", () => {
    const block = toReducedMotionMediaBlock(resolved, ".aurora");
    expect(block).toContain(".aurora {");
  });
});

describe("toCssVariablesString — reducedMotion default", () => {
  const resolved = resolveTheme(aurora, "light");

  it("appends the @media block by default", () => {
    const css = toCssVariablesString(resolved);
    expect(css).toContain(":root {");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("omits the @media block when reducedMotion: \"off\"", () => {
    const css = toCssVariablesString(resolved, ":root", { reducedMotion: "off" });
    expect(css).not.toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("the @media block clamps every motion duration var to the same value", () => {
    const css = toCssVariablesString(resolved);
    const reducedMs = (resolved.tokens["pm.motion.duration.reduced"]!.value as { value: number }).value;
    const expected = `${reducedMs}ms`;
    // Pull out the media-block body and assert every motion-duration line carries `expected`.
    const blockMatch = /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\}\s*\}/.exec(css);
    expect(blockMatch).toBeTruthy();
    const block = blockMatch![0];
    for (const id of ["short", "base", "long"]) {
      const m = new RegExp(`--pm-motion-duration-${id}: ([^;]+);`).exec(block);
      expect(m?.[1]).toBe(expected);
    }
  });
});
