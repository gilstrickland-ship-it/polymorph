import { describe, it, expect } from "vitest";
import { contrastRatio, parseColor } from "../src/contrast.js";

describe("contrastRatio (WCAG 2.1)", () => {
  it("black on white is 21:1", () => {
    expect(Math.round(contrastRatio("#000000", "#ffffff"))).toBe(21);
  });
  it("identical colors are 1:1", () => {
    expect(contrastRatio("#1f2933", "#1f2933")).toBeCloseTo(1, 5);
  });
  it("parses rgb() and short hex", () => {
    expect(contrastRatio("rgb(0,0,0)", "#fff")).toBeCloseTo(21, 1);
  });
  it("throws on a genuinely unparseable color", () => {
    expect(() => contrastRatio("currentColor", "#000")).toThrow();
  });
});

describe("CSS Color 4 parsing", () => {
  it("parses hsl()", () => {
    expect(parseColor("hsl(0 0% 0%)")).toEqual([0, 0, 0]);
    expect(parseColor("hsla(0, 0%, 100%)")).toEqual([255, 255, 255]);
    expect(contrastRatio("hsl(0 0% 0%)", "hsl(0 0% 100%)")).toBeCloseTo(21, 1);
  });
  it("parses oklch() — extremes are black and white", () => {
    expect(contrastRatio("oklch(0 0 0)", "oklch(1 0 0)")).toBeCloseTo(21, 0);
  });
  it("parses oklab() — extremes are black and white", () => {
    expect(contrastRatio("oklab(0 0 0)", "oklab(1 0 0)")).toBeCloseTo(21, 0);
  });
  it("parses color(display-p3 …)", () => {
    expect(contrastRatio("color(display-p3 0 0 0)", "color(display-p3 1 1 1)")).toBeCloseTo(21, 0);
  });
  it("accepts %-valued sRGB channels", () => {
    expect(parseColor("rgb(0% 0% 0%)")).toEqual([0, 0, 0]);
    expect(parseColor("rgb(100% 100% 100%)")).toEqual([255, 255, 255]);
  });
});
