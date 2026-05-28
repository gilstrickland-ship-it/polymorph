import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { transformToDart } from "@polymorph/adapter-flutter";
import { transformToSwift } from "@polymorph/adapter-swift";
import { transformToKotlin } from "@polymorph/adapter-kotlin";
import type { ThemeMode } from "@polymorph/spec";
import { parseDart, parseSwift, parseKotlin, diffSnapshots } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");

const loadBank = (name: "aurora" | "borealis"): unknown =>
  JSON.parse(readFileSync(join(repoRoot, "examples", `mock-bank-${name}`, "theme", `${name}.tokens.json`), "utf8"));

const banks = [
  { name: "aurora", theme: loadBank("aurora") },
  { name: "borealis", theme: loadBank("borealis") },
] as const;
const modes: ThemeMode[] = ["light", "dark"];

const fixtures = banks.flatMap((b) => modes.map((mode) => ({ bank: b.name, theme: b.theme, mode })));

describe("native codegen parity — Dart / Swift / Kotlin", () => {
  for (const f of fixtures) {
    it(`${f.bank}_${f.mode}: dart vs. swift match`, () => {
      const dart = parseDart(transformToDart(f.theme, { mode: f.mode }));
      const swift = parseSwift(transformToSwift(f.theme, { mode: f.mode }));
      const mismatches = diffSnapshots(dart, swift);
      expect(mismatches, JSON.stringify(mismatches.slice(0, 5), null, 2)).toEqual([]);
    });

    it(`${f.bank}_${f.mode}: dart vs. kotlin match`, () => {
      const dart = parseDart(transformToDart(f.theme, { mode: f.mode }));
      const kotlin = parseKotlin(transformToKotlin(f.theme, { mode: f.mode }));
      const mismatches = diffSnapshots(dart, kotlin);
      expect(mismatches, JSON.stringify(mismatches.slice(0, 5), null, 2)).toEqual([]);
    });

    it(`${f.bank}_${f.mode}: swift vs. kotlin match`, () => {
      const swift = parseSwift(transformToSwift(f.theme, { mode: f.mode }));
      const kotlin = parseKotlin(transformToKotlin(f.theme, { mode: f.mode }));
      const mismatches = diffSnapshots(swift, kotlin);
      expect(mismatches, JSON.stringify(mismatches.slice(0, 5), null, 2)).toEqual([]);
    });

    it(`${f.bank}_${f.mode}: all three snapshots cover the same token names`, () => {
      const dart = parseDart(transformToDart(f.theme, { mode: f.mode }));
      const swift = parseSwift(transformToSwift(f.theme, { mode: f.mode }));
      const kotlin = parseKotlin(transformToKotlin(f.theme, { mode: f.mode }));
      const dartNames = [...dart.keys()].sort();
      const swiftNames = [...swift.keys()].sort();
      const kotlinNames = [...kotlin.keys()].sort();
      expect(swiftNames).toEqual(dartNames);
      expect(kotlinNames).toEqual(dartNames);
      // Sanity: at least 30 tokens (each bank fixture has well above that).
      expect(dartNames.length).toBeGreaterThanOrEqual(30);
    });
  }
});

describe("snapshot diff — invariants", () => {
  it("identical snapshots produce no mismatches", () => {
    const a = parseDart(transformToDart(banks[0].theme, { mode: "light" }));
    const b = parseDart(transformToDart(banks[0].theme, { mode: "light" }));
    expect(diffSnapshots(a, b)).toEqual([]);
  });

  it("light and dark of the same bank differ in colors but agree on dimensions/motion", () => {
    const light = parseDart(transformToDart(banks[0].theme, { mode: "light" }));
    const dark = parseDart(transformToDart(banks[0].theme, { mode: "dark" }));
    const mismatches = diffSnapshots(light, dark);
    // Some tokens differ (the color/text ones); but there should be a non-trivial overlap of
    // tokens whose values are identical (the dimensions, motion, opacity).
    const sameNames = [...light.keys()].filter((n) => {
      const a = light.get(n);
      const b = dark.get(n);
      return a && b && diffSnapshots(new Map([[n, a]]), new Map([[n, b]])).length === 0;
    });
    expect(mismatches.length).toBeGreaterThan(0);
    expect(sameNames.length).toBeGreaterThan(0);
  });
});
