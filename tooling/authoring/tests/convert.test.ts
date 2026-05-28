import { describe, it, expect } from "vitest";
import {
  parseDimension,
  normalizeFontWeight,
  normalizeLineHeight,
  normalizeOpacity,
  resolveValue,
  convertToDtcg,
} from "../src/index.js";
import type { TokensStudioToken } from "../src/index.js";

describe("parseDimension", () => {
  it("accepts numbers, bare numerics, and px/rem strings", () => {
    expect(parseDimension(16)).toEqual({ value: 16, unit: "px" });
    expect(parseDimension("16")).toEqual({ value: 16, unit: "px" });
    expect(parseDimension("16px")).toEqual({ value: 16, unit: "px" });
    expect(parseDimension("1.5rem")).toEqual({ value: 1.5, unit: "rem" });
    expect(parseDimension("garbage")).toBeNull();
  });
});

describe("normalizeFontWeight", () => {
  it("maps Tokens Studio weight names to numeric weights", () => {
    expect(normalizeFontWeight("Regular")).toBe(400);
    expect(normalizeFontWeight("Bold")).toBe(700);
    expect(normalizeFontWeight("Semi Bold")).toBe(600);
    expect(normalizeFontWeight("ExtraLight")).toBe(200);
    expect(normalizeFontWeight(500)).toBe(500);
    expect(normalizeFontWeight("400")).toBe(400);
  });
});

describe("normalizeLineHeight", () => {
  it("handles numbers, percentages, and AUTO", () => {
    expect(normalizeLineHeight(1.4)).toBe(1.4);
    expect(normalizeLineHeight("150%")).toBe(1.5);
    expect(normalizeLineHeight("AUTO")).toBe(1.2);
    expect(normalizeLineHeight("not a number")).toBeNull();
  });
});

describe("normalizeOpacity", () => {
  it("handles numbers and percentages", () => {
    expect(normalizeOpacity(0.5)).toBe(0.5);
    expect(normalizeOpacity("50%")).toBe(0.5);
    expect(normalizeOpacity("0.4")).toBe(0.4);
  });
});

describe("resolveValue", () => {
  it("follows aliases through the registry", () => {
    const reg = new Map<string, TokensStudioToken>([
      ["palette.blue.500", { value: "#1f5cff", type: "color" }],
      ["color.brand", { value: "{palette.blue.500}", type: "color" }],
    ]);
    expect(resolveValue("{color.brand}", reg)).toBe("#1f5cff");
  });
  it("throws on a dangling alias and on a cycle", () => {
    const reg = new Map<string, TokensStudioToken>([["a", { value: "{b}", type: "color" }]]);
    expect(() => resolveValue("{a}", reg)).toThrow(/unknown token/);
    const cyc = new Map<string, TokensStudioToken>([
      ["a", { value: "{b}", type: "color" }],
      ["b", { value: "{a}", type: "color" }],
    ]);
    expect(() => resolveValue("{a}", cyc)).toThrow(/cycle/);
  });
});

describe("convertToDtcg — type-by-type", () => {
  const reg = new Map<string, TokensStudioToken>();

  it("color → DTCG color", () => {
    const out = convertToDtcg({ value: "#1f2933", type: "color" }, "color", reg);
    expect(out).toEqual({ $type: "color", $value: "#1f2933" });
  });
  it("spacing-like → DTCG dimension {value,unit}", () => {
    const out = convertToDtcg({ value: "16px", type: "spacing" }, "dimension", reg);
    expect(out).toEqual({ $type: "dimension", $value: { value: 16, unit: "px" } });
  });
  it("typography composite → DTCG typography with five sub-properties", () => {
    const out = convertToDtcg(
      { value: { fontFamily: "Inter", fontWeight: "Regular", fontSize: "16px", lineHeight: "150%", letterSpacing: "0%" }, type: "typography" },
      "typography",
      reg,
    );
    expect(out?.$value).toEqual({
      fontFamily: "Inter",
      fontWeight: 400,
      fontSize: { value: 16, unit: "px" },
      lineHeight: 1.5,
      letterSpacing: { value: 0, unit: "px" },
    });
  });
  it("boxShadow → DTCG shadow", () => {
    const out = convertToDtcg(
      { value: { x: "0", y: "2px", blur: "4px", spread: "0", color: "#000", type: "dropShadow" }, type: "boxShadow" },
      "shadow",
      reg,
    );
    expect(out?.$value).toMatchObject({
      color: "#000",
      offsetX: { value: 0, unit: "px" },
      offsetY: { value: 2, unit: "px" },
      blur: { value: 4, unit: "px" },
      spread: { value: 0, unit: "px" },
    });
  });
  it("opacity → DTCG number", () => {
    expect(convertToDtcg({ value: "40%", type: "opacity" }, "number", reg)).toEqual({ $type: "number", $value: 0.4 });
  });
  it("returns null on type mismatch (caller decides whether to skip or throw)", () => {
    expect(convertToDtcg({ value: "not a dimension", type: "spacing" }, "dimension", reg)).toBeNull();
  });
});
