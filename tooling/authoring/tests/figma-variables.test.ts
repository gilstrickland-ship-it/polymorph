import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  importFigmaVariables,
  convertFigmaValue,
  figmaColorToHex,
  resolveAlias,
  type FigmaVariablesResponse,
  type FigmaMapping,
} from "../src/index.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const exportJson = JSON.parse(readFileSync(join(fixtures, "figma-variables.export.json"), "utf8")) as FigmaVariablesResponse;

const baseMapping: FigmaMapping = {
  ids: {
    "pm.space.md": "space/md",
    "pm.radius.control": "radius/control",
    "pm.opacity.disabled": "opacity/disabled",
    "pm.motion.duration.base": "motion/duration/base",
    "pm.color.surface.base": "color/surface/base",
    "pm.color.text.body": "color/text/body",
    "pm.color.action.primary.rest": "color/action/primary/rest",
  },
  modes: {
    light: "Light",
    dark: "Dark",
  },
  collection: "Polymorph",
};

describe("importFigmaVariables — end-to-end", () => {
  const { theme, report } = importFigmaVariables(exportJson, baseMapping);

  it("imports every mapped Polymorph id with no missing or unconvertible tokens", () => {
    expect(report.missing).toEqual([]);
    expect(report.unconvertible).toEqual([]);
    // 4 invariant (space/radius/opacity/motion) + 3 mode-sensitive × 2 modes = 10 imports total.
    expect(report.imported.length).toBe(4 + 3 * 2);
    expect(new Set(report.imported).size).toBe(7);
  });

  it("routes mode-invariant tokens under pm.* directly", () => {
    const pm = theme.pm as Record<string, unknown>;
    expect((pm.space as Record<string, unknown>).md).toEqual({ $type: "dimension", $value: { value: 16, unit: "px" } });
    expect((pm.radius as Record<string, unknown>).control).toEqual({ $type: "dimension", $value: { value: 10, unit: "px" } });
    expect((pm.opacity as Record<string, unknown>).disabled).toEqual({ $type: "number", $value: 0.4 });
  });

  it("routes mode-sensitive tokens under pm.modes.<mode>.*", () => {
    const modes = (theme.pm as { modes: Record<string, unknown> }).modes;
    const light = modes.light as Record<string, unknown>;
    const dark = modes.dark as Record<string, unknown>;
    expect((light.color as Record<string, unknown>)).toHaveProperty("surface");
    expect((dark.color as Record<string, unknown>)).toHaveProperty("surface");
  });

  it("resolves an alias chain to the target's concrete value", () => {
    const modes = (theme.pm as { modes: Record<string, unknown> }).modes;
    const lightAction = (((modes.light as Record<string, unknown>).color as Record<string, unknown>).action as Record<string, unknown>).primary as Record<string, unknown>;
    expect((lightAction.rest as { $value: string }).$value).toBe("#1f5cff");
  });

  it("emits hex with full opacity by default, and #rrggbbaa when alpha < 1", () => {
    expect(figmaColorToHex({ r: 0.122, g: 0.361, b: 1.0, a: 1 })).toBe("#1f5cff");
    expect(figmaColorToHex({ r: 0, g: 0, b: 0, a: 0.5 })).toBe("#00000080");
  });
});

describe("importFigmaVariables — reporting", () => {
  it("reports a mapped id whose Figma variable is not found", () => {
    const { report } = importFigmaVariables(exportJson, {
      ...baseMapping,
      ids: { ...baseMapping.ids, "pm.size.touchTarget.min": "size/touchTarget/min" },
    });
    expect(report.missing).toContainEqual({
      id: "pm.size.touchTarget.min",
      path: "size/touchTarget/min",
      mode: "invariant",
    });
  });

  it("reports unconvertible when the Figma type can't satisfy the contract type", () => {
    const { report } = importFigmaVariables(exportJson, {
      ...baseMapping,
      ids: { ...baseMapping.ids, "pm.typography.body": "color/text/body" },
    });
    // typography isn't representable from a single Figma Variable; convertFigmaValue returns null.
    expect(report.unconvertible.some((u) => u.id === "pm.typography.body")).toBe(true);
  });
});

describe("convertFigmaValue", () => {
  it("color: Figma { r,g,b,a } → DTCG #rrggbb token", () => {
    expect(convertFigmaValue({ r: 1, g: 1, b: 1, a: 1 }, "color")).toEqual({
      $type: "color",
      $value: "#ffffff",
    });
  });
  it("dimension: FLOAT → DTCG `{ value, unit: 'px' }`", () => {
    expect(convertFigmaValue(16, "dimension")).toEqual({
      $type: "dimension",
      $value: { value: 16, unit: "px" },
    });
  });
  it("number: FLOAT passthrough", () => {
    expect(convertFigmaValue(0.4, "number")).toEqual({ $type: "number", $value: 0.4 });
  });
  it("duration: FLOAT → DTCG `{ value, unit: 'ms' }`", () => {
    expect(convertFigmaValue(220, "duration")).toEqual({
      $type: "duration",
      $value: { value: 220, unit: "ms" },
    });
  });
  it("typography/shadow/cubicBezier: not representable in Figma Variables → null", () => {
    expect(convertFigmaValue({ r: 1, g: 1, b: 1 }, "typography")).toBeNull();
    expect(convertFigmaValue(16, "shadow")).toBeNull();
    expect(convertFigmaValue(0, "cubicBezier")).toBeNull();
  });
});

describe("resolveAlias", () => {
  const vars = exportJson.meta.variables;
  it("follows a VARIABLE_ALIAS to its concrete value", () => {
    const aliasNode = vars["VariableID:color.action.primary.rest"]!.valuesByMode["1:0"]!;
    const resolved = resolveAlias(aliasNode, "1:0", vars);
    expect(resolved).toEqual({ r: 0.122, g: 0.361, b: 1.0, a: 1 });
  });
  it("throws on an alias cycle", () => {
    const cyclic = {
      "VariableID:a": {
        id: "VariableID:a",
        name: "a",
        variableCollectionId: "c",
        resolvedType: "COLOR" as const,
        valuesByMode: { "m": { type: "VARIABLE_ALIAS" as const, id: "VariableID:b" } },
      },
      "VariableID:b": {
        id: "VariableID:b",
        name: "b",
        variableCollectionId: "c",
        resolvedType: "COLOR" as const,
        valuesByMode: { "m": { type: "VARIABLE_ALIAS" as const, id: "VariableID:a" } },
      },
    };
    expect(() => resolveAlias({ type: "VARIABLE_ALIAS", id: "VariableID:a" }, "m", cyclic)).toThrow(/alias cycle/);
  });
  it("throws on a dangling alias", () => {
    expect(() => resolveAlias({ type: "VARIABLE_ALIAS", id: "VariableID:nope" }, "1:0", vars)).toThrow(/unknown variable/);
  });
});
