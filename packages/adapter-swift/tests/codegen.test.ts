import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  transformToSwift,
  colorToSwift,
  dimToSwift,
  durationToSwift,
  cubicBezierToSwift,
  numberToSwift,
  typographyToSwift,
  shadowToSwift,
  idToSwiftName,
  componentPropSwiftName,
} from "../src/index.js";
import type { ThemeMode } from "@polymorph/spec";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const repoRoot = join(pkgRoot, "..", "..");
const goldens = join(pkgRoot, "tests", "golden");

const loadBank = (name: "aurora" | "borealis"): unknown =>
  JSON.parse(readFileSync(join(repoRoot, "examples", `mock-bank-${name}`, "theme", `${name}.tokens.json`), "utf8"));

const banks = [
  { name: "aurora", theme: loadBank("aurora") },
  { name: "borealis", theme: loadBank("borealis") },
] as const;
const modes: ThemeMode[] = ["light", "dark"];

describe("transformToSwift — committed Swift goldens", () => {
  for (const bank of banks) {
    for (const mode of modes) {
      it(`${bank.name}_${mode}.swift matches its golden`, () => {
        const enumName = `${bank.name[0]!.toUpperCase()}${bank.name.slice(1)}Theme${mode[0]!.toUpperCase()}${mode.slice(1)}`;
        const actual = transformToSwift(bank.theme, { mode, enumName });
        const expected = readFileSync(join(goldens, `${bank.name}_${mode}.swift`), "utf8");
        expect(actual).toBe(expected);
      });
    }
  }
});

describe("idToSwiftName / componentPropSwiftName", () => {
  it("turns pm.* ids into Swift camelCase identifiers", () => {
    expect(idToSwiftName("pm.color.surface.base")).toBe("colorSurfaceBase");
    expect(idToSwiftName("pm.color.action.primary.rest")).toBe("colorActionPrimaryRest");
    expect(idToSwiftName("pm.space.md")).toBe("spaceMd");
    expect(idToSwiftName("pm.size.touchTarget.min")).toBe("sizeTouchTargetMin");
  });
  it("combines a role + property into one camelCase identifier", () => {
    expect(componentPropSwiftName("button.primary", "background")).toBe("buttonPrimaryBackground");
    expect(componentPropSwiftName("input", "borderFocus")).toBe("inputBorderFocus");
  });
});

describe("per-type Swift converters", () => {
  it("colors emit SwiftUI Color(red:green:blue:) with 0...1 channels, accepting any CSS Color 4 form", () => {
    expect(colorToSwift("#1f5cff")).toBe("Color(red: 0.1216, green: 0.3608, blue: 1)");
    expect(colorToSwift("rgb(0, 0, 0)")).toBe("Color(red: 0, green: 0, blue: 0)");
    expect(colorToSwift("hsl(0 100% 50%)")).toBe("Color(red: 1, green: 0, blue: 0)");
    expect(colorToSwift("oklch(1 0 0)")).toBe("Color(red: 1, green: 1, blue: 1)");
    expect(colorToSwift("currentColor")).toBeNull();
  });

  it("dimensions become Swift CGFloat literals (px assumed; rem multiplied by 16)", () => {
    expect(dimToSwift({ value: 8, unit: "px" })).toBe("8.0");
    expect(dimToSwift({ value: 1.5, unit: "rem" })).toBe("24.0");
    expect(dimToSwift("16px")).toBeNull();
  });

  it("durations become Swift TimeInterval seconds (220ms → 0.22, 1s → 1.0)", () => {
    expect(durationToSwift({ value: 220, unit: "ms" })).toBe("0.22");
    expect(durationToSwift({ value: 1, unit: "s" })).toBe("1.0");
  });

  it("cubicBezier becomes a Swift (Double, Double, Double, Double) tuple literal", () => {
    expect(cubicBezierToSwift([0.4, 0, 0.2, 1])).toBe("(0.4, 0.0, 0.2, 1.0)");
  });

  it("numbers become Swift Double literals (always carry a decimal)", () => {
    expect(numberToSwift(0.4)).toBe("0.4");
    expect(numberToSwift(0)).toBe("0.0");
  });

  it("typography composites become PolymorphTextStyle(...) with the nearest Font.Weight", () => {
    const out = typographyToSwift({
      fontFamily: "Inter",
      fontWeight: 600,
      fontSize: { value: 16, unit: "px" },
      lineHeight: 1.4,
      letterSpacing: { value: 0, unit: "px" },
    });
    expect(out).toContain('font: Font.custom("Inter", size: 16.0)');
    expect(out).toContain("weight: .semibold");
    expect(out).toContain("fontSize: 16.0");
    expect(out).toContain("lineHeight: 1.4");
    expect(out).toContain("letterSpacing: 0.0");
  });

  it("shadows render as [PolymorphShadow]; arrays expand inline", () => {
    const single = shadowToSwift({
      color: "#00000022",
      offsetX: { value: 0, unit: "px" },
      offsetY: { value: 2, unit: "px" },
      blur: { value: 6, unit: "px" },
      spread: { value: 0, unit: "px" },
    });
    expect(single).toContain("PolymorphShadow(color: Color(");
    expect(single).toContain("x: 0.0, y: 2.0, radius: 6.0");

    const arr = shadowToSwift([
      { color: "#000", offsetX: { value: 0, unit: "px" }, offsetY: { value: 1, unit: "px" }, blur: { value: 2, unit: "px" }, spread: { value: 0, unit: "px" } },
      { color: "#000", offsetX: { value: 0, unit: "px" }, offsetY: { value: 4, unit: "px" }, blur: { value: 8, unit: "px" }, spread: { value: 0, unit: "px" } },
    ]);
    expect(arr).toMatch(/PolymorphShadow\(.*\),\n {6}PolymorphShadow\(/s);
  });
});
