import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  transformToKotlin,
  colorToKotlin,
  dimToKotlin,
  durationToKotlin,
  cubicBezierToKotlin,
  numberToKotlin,
  typographyToKotlin,
  shadowToKotlin,
  idToKotlinName,
  componentPropKotlinName,
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

describe("transformToKotlin — committed Kotlin goldens", () => {
  for (const bank of banks) {
    for (const mode of modes) {
      it(`${bank.name}_${mode}.kt matches its golden`, () => {
        const objectName = `${bank.name[0]!.toUpperCase()}${bank.name.slice(1)}Theme${mode[0]!.toUpperCase()}${mode.slice(1)}`;
        const actual = transformToKotlin(bank.theme, { mode, objectName });
        const expected = readFileSync(join(goldens, `${bank.name}_${mode}.kt`), "utf8");
        expect(actual).toBe(expected);
      });
    }
  }
});

describe("idToKotlinName / componentPropKotlinName", () => {
  it("turns pm.* ids into Kotlin camelCase identifiers", () => {
    expect(idToKotlinName("pm.color.surface.base")).toBe("colorSurfaceBase");
    expect(idToKotlinName("pm.color.action.primary.rest")).toBe("colorActionPrimaryRest");
    expect(idToKotlinName("pm.space.md")).toBe("spaceMd");
    expect(idToKotlinName("pm.size.touchTarget.min")).toBe("sizeTouchTargetMin");
  });
  it("combines a role + property into one camelCase identifier", () => {
    expect(componentPropKotlinName("button.primary", "background")).toBe("buttonPrimaryBackground");
    expect(componentPropKotlinName("input", "borderFocus")).toBe("inputBorderFocus");
  });
});

describe("per-type Kotlin converters", () => {
  it("colors emit Compose Color(0xFFRRGGBB), accepting any CSS Color 4 form", () => {
    expect(colorToKotlin("#1f5cff")).toBe("Color(0xFF1F5CFF)");
    expect(colorToKotlin("rgb(0, 0, 0)")).toBe("Color(0xFF000000)");
    expect(colorToKotlin("hsl(0 100% 50%)")).toBe("Color(0xFFFF0000)");
    expect(colorToKotlin("oklch(1 0 0)")).toBe("Color(0xFFFFFFFF)");
    expect(colorToKotlin("currentColor")).toBeNull();
  });

  it("dimensions become Compose Dp via the .dp extension (px assumed; rem multiplied by 16)", () => {
    expect(dimToKotlin({ value: 8, unit: "px" })).toBe("8.0f.dp");
    expect(dimToKotlin({ value: 1.5, unit: "rem" })).toBe("24.0f.dp");
    expect(dimToKotlin("16px")).toBeNull();
  });

  it("durations become Kotlin Int milliseconds (220ms → 220, 1s → 1000)", () => {
    expect(durationToKotlin({ value: 220, unit: "ms" })).toBe("220");
    expect(durationToKotlin({ value: 1, unit: "s" })).toBe("1000");
  });

  it("cubicBezier becomes Compose CubicBezierEasing(...)", () => {
    expect(cubicBezierToKotlin([0.4, 0, 0.2, 1])).toBe("CubicBezierEasing(0.4f, 0.0f, 0.2f, 1.0f)");
  });

  it("numbers become Kotlin Float literals with the f suffix", () => {
    expect(numberToKotlin(0.4)).toBe("0.4f");
    expect(numberToKotlin(0)).toBe("0.0f");
  });

  it("typography composites become PolymorphTextStyle(...) with the nearest FontWeight", () => {
    const out = typographyToKotlin({
      fontFamily: "Inter",
      fontWeight: 600,
      fontSize: { value: 16, unit: "px" },
      lineHeight: 1.4,
      letterSpacing: { value: 0, unit: "px" },
    });
    expect(out).toContain('fontFamily = "Inter"');
    expect(out).toContain("fontWeight = FontWeight.W600");
    expect(out).toContain("fontSize = 16.0f.sp");
    expect(out).toContain("lineHeight = 1.4f");
    expect(out).toContain("letterSpacing = 0.0f.sp");
  });

  it("shadows render as listOf(PolymorphShadow(...)); arrays expand inline", () => {
    const single = shadowToKotlin({
      color: "#00000022",
      offsetX: { value: 0, unit: "px" },
      offsetY: { value: 2, unit: "px" },
      blur: { value: 6, unit: "px" },
      spread: { value: 0, unit: "px" },
    });
    expect(single).toContain("PolymorphShadow(color = Color(");
    expect(single).toContain("x = 0.0f.dp, y = 2.0f.dp, radius = 6.0f.dp");

    const arr = shadowToKotlin([
      { color: "#000", offsetX: { value: 0, unit: "px" }, offsetY: { value: 1, unit: "px" }, blur: { value: 2, unit: "px" }, spread: { value: 0, unit: "px" } },
      { color: "#000", offsetX: { value: 0, unit: "px" }, offsetY: { value: 4, unit: "px" }, blur: { value: 8, unit: "px" }, spread: { value: 0, unit: "px" } },
    ]);
    expect(arr).toMatch(/PolymorphShadow\(.*\),\n {4}PolymorphShadow\(/s);
  });
});
