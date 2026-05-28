import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  transformToDart,
  colorToDart,
  dimToDart,
  durationToDart,
  cubicBezierToDart,
  numberToDart,
  typographyToDart,
  shadowToDart,
  idToDartName,
  componentPropDartName,
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

describe("transformToDart — committed Dart goldens", () => {
  for (const bank of banks) {
    for (const mode of modes) {
      it(`${bank.name}_${mode}.dart matches its golden`, () => {
        const className = `${bank.name[0]!.toUpperCase()}${bank.name.slice(1)}Theme${mode[0]!.toUpperCase()}${mode.slice(1)}`;
        const actual = transformToDart(bank.theme, { mode, className });
        const expected = readFileSync(join(goldens, `${bank.name}_${mode}.dart`), "utf8");
        expect(actual).toBe(expected);
      });
    }
  }
});

describe("idToDartName / componentPropDartName", () => {
  it("turns pm.* ids into Dart-style camelCase names", () => {
    expect(idToDartName("pm.color.surface.base")).toBe("colorSurfaceBase");
    expect(idToDartName("pm.color.action.primary.rest")).toBe("colorActionPrimaryRest");
    expect(idToDartName("pm.space.md")).toBe("spaceMd");
    expect(idToDartName("pm.size.touchTarget.min")).toBe("sizeTouchTargetMin");
  });
  it("combines a role + property into one camelCase identifier", () => {
    expect(componentPropDartName("button.primary", "background")).toBe("buttonPrimaryBackground");
    expect(componentPropDartName("input", "borderFocus")).toBe("inputBorderFocus");
  });
});

describe("per-type Dart converters", () => {
  it("colors emit Color(0xAARRGGBB) with full opacity, accepting any CSS Color 4 form", () => {
    expect(colorToDart("#1f5cff")).toBe("Color(0xFF1F5CFF)");
    expect(colorToDart("rgb(0, 0, 0)")).toBe("Color(0xFF000000)");
    expect(colorToDart("hsl(0 100% 50%)")).toBe("Color(0xFFFF0000)");
    expect(colorToDart("oklch(1 0 0)")).toBe("Color(0xFFFFFFFF)");
    expect(colorToDart("currentColor")).toBeNull();
  });

  it("dimensions become Dart doubles (with px assumed; rem multiplied by 16)", () => {
    expect(dimToDart({ value: 8, unit: "px" })).toBe("8.0");
    expect(dimToDart({ value: 1.5, unit: "rem" })).toBe("24.0");
    expect(dimToDart("16px")).toBeNull();
  });

  it("durations become Duration(milliseconds: …) / (seconds: …)", () => {
    expect(durationToDart({ value: 220, unit: "ms" })).toBe("Duration(milliseconds: 220)");
    expect(durationToDart({ value: 1, unit: "s" })).toBe("Duration(seconds: 1)");
  });

  it("cubicBezier becomes Cubic(...)", () => {
    expect(cubicBezierToDart([0.4, 0, 0.2, 1])).toBe("Cubic(0.4, 0.0, 0.2, 1.0)");
  });

  it("numbers become Dart doubles", () => {
    expect(numberToDart(0.4)).toBe("0.4");
    expect(numberToDart(0)).toBe("0.0");
  });

  it("typography composites become TextStyle(...) with the right FontWeight enum", () => {
    const out = typographyToDart({
      fontFamily: "Inter",
      fontWeight: 600,
      fontSize: { value: 16, unit: "px" },
      lineHeight: 1.4,
      letterSpacing: { value: 0, unit: "px" },
    });
    expect(out).toContain("fontFamily: 'Inter'");
    expect(out).toContain("fontWeight: FontWeight.w600");
    expect(out).toContain("fontSize: 16.0");
    expect(out).toContain("height: 1.4");
    expect(out).toContain("letterSpacing: 0.0");
  });

  it("shadows render as List<BoxShadow>; arrays expand inline", () => {
    const single = shadowToDart({
      color: "#00000022",
      offsetX: { value: 0, unit: "px" },
      offsetY: { value: 2, unit: "px" },
      blur: { value: 6, unit: "px" },
      spread: { value: 0, unit: "px" },
    });
    expect(single).toContain("BoxShadow(color: Color(0xFF000000)");
    expect(single).toContain("offset: Offset(0.0, 2.0)");

    const arr = shadowToDart([
      { color: "#000", offsetX: { value: 0, unit: "px" }, offsetY: { value: 1, unit: "px" }, blur: { value: 2, unit: "px" }, spread: { value: 0, unit: "px" } },
      { color: "#000", offsetX: { value: 0, unit: "px" }, offsetY: { value: 4, unit: "px" }, blur: { value: 8, unit: "px" }, spread: { value: 0, unit: "px" } },
    ]);
    expect(arr).toMatch(/BoxShadow\(.*\),\n {6}BoxShadow\(/s);
  });
});
