import { describe, it, expect } from "vitest";
import { contrastRatio } from "../src/contrast.js";

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
  it("throws on an unparseable color", () => {
    expect(() => contrastRatio("oklch(0.7 0.1 200)", "#000")).toThrow();
  });
});
