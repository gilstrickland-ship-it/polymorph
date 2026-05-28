import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  importFigmaStyles,
  convertFigmaTextStyle,
  convertFigmaEffects,
  type FigmaStylesInput,
  type FigmaStylesMapping,
} from "../src/index.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const input = JSON.parse(readFileSync(join(fixtures, "figma-styles.export.json"), "utf8")) as FigmaStylesInput;

const baseMapping: FigmaStylesMapping = {
  textStyles: {
    "pm.typography.display": "Heading / Display",
    "pm.typography.heading": "Heading / H1",
    "pm.typography.body": "Body / Default",
    "pm.typography.bodyStrong": "Body / Strong",
    "pm.typography.label": "Label / Default",
    "pm.typography.caption": "Caption / Default",
    "pm.typography.mono": "Mono / Default",
  },
  effectStyles: {
    "pm.elevation.flat": "Elevation / Flat",
    "pm.elevation.raised": "Elevation / Raised",
    "pm.elevation.overlay": "Elevation / Overlay",
  },
};

describe("importFigmaStyles — end-to-end", () => {
  it("imports every mapped Polymorph id (typography) with no missing or unconvertible", () => {
    const { report } = importFigmaStyles(input, baseMapping);
    expect(report.missing).toEqual([]);
    // Elevation/Flat resolves to an empty effects array → convertFigmaEffects returns null →
    // reports as unconvertible (the contract requires a non-empty shadow).
    expect(report.unconvertible.map((u) => u.id)).toEqual(["pm.elevation.flat"]);
    expect(report.imported.length).toBe(7 + 2);
  });

  it("emits typography under pm.* directly (mode-invariant per the contract)", () => {
    const { theme } = importFigmaStyles(input, baseMapping);
    const pm = theme.pm as Record<string, unknown>;
    const body = (pm.typography as Record<string, { $value: Record<string, unknown> }>).body!.$value;
    expect(body.fontFamily).toBe("Inter");
    expect(body.fontWeight).toBe(400);
    expect(body.fontSize).toEqual({ value: 16, unit: "px" });
    expect(body.lineHeight).toBe(1.4); // 140% → 1.4
  });

  it("emits shadows under pm.modes.<mode>.* (default light)", () => {
    const { theme } = importFigmaStyles(input, baseMapping);
    const modes = (theme.pm as { modes: Record<string, unknown> }).modes;
    expect(modes).toHaveProperty("light");
    const elevation = ((modes.light as Record<string, unknown>).elevation as Record<string, { $value: unknown }>);
    expect(elevation.raised).toBeTruthy();
    expect(elevation.overlay).toBeTruthy();
  });

  it("honours `mapping.mode` for dark-mode shadows", () => {
    const { theme } = importFigmaStyles(input, { ...baseMapping, mode: "dark" });
    const modes = (theme.pm as { modes: Record<string, unknown> }).modes;
    expect(modes).toHaveProperty("dark");
    expect(modes).not.toHaveProperty("light");
  });

  it("stacks multi-effect shadows into an array", () => {
    const { theme } = importFigmaStyles(input, baseMapping);
    const raised = (((theme.pm as { modes: Record<string, unknown> }).modes.light as Record<string, unknown>)
      .elevation as Record<string, { $value: unknown }>).raised!.$value as unknown[];
    expect(Array.isArray(raised)).toBe(true);
    expect(raised.length).toBe(2);
  });
});

describe("importFigmaStyles — reporting", () => {
  it("reports a mapped id whose Figma style is not found", () => {
    const { report } = importFigmaStyles(input, {
      ...baseMapping,
      textStyles: { ...baseMapping.textStyles, "pm.typography.headingSm": "Heading / H2 (missing)" },
    });
    expect(report.missing).toContainEqual({
      id: "pm.typography.headingSm",
      path: "Heading / H2 (missing)",
      mode: "invariant",
    });
  });

  it("silently drops a BACKGROUND_BLUR effect (not representable in the contract)", () => {
    const { report, theme } = importFigmaStyles(input, {
      textStyles: {},
      effectStyles: { "pm.elevation.flat": "Blur / Background" },
    });
    // No DROP_SHADOW/INNER_SHADOW → convertFigmaEffects returns null → reports unconvertible.
    expect(report.unconvertible.some((u) => u.id === "pm.elevation.flat")).toBe(true);
    expect(theme.pm).not.toHaveProperty("modes");
  });
});

describe("convertFigmaTextStyle", () => {
  it("lineHeightPx is converted to a multiplier (lineHeightPx / fontSize)", () => {
    const out = convertFigmaTextStyle({
      fontFamily: "Inter",
      fontWeight: 400,
      fontSize: 16,
      lineHeightPx: 24,
      letterSpacing: 0,
    });
    expect((out!.$value as { lineHeight: number }).lineHeight).toBe(1.5);
  });

  it("lineHeightPercent is converted to a multiplier (percent / 100)", () => {
    const out = convertFigmaTextStyle({
      fontFamily: "Inter",
      fontWeight: 600,
      fontSize: 16,
      lineHeightPercent: 150,
    });
    expect((out!.$value as { lineHeight: number }).lineHeight).toBe(1.5);
  });

  it("defaults lineHeight to 1.4 when neither lineHeightPx nor lineHeightPercent is supplied", () => {
    const out = convertFigmaTextStyle({ fontFamily: "Inter", fontWeight: 400, fontSize: 16 });
    expect((out!.$value as { lineHeight: number }).lineHeight).toBe(1.4);
  });

  it("returns null when a required property is missing", () => {
    expect(convertFigmaTextStyle({ fontFamily: "Inter", fontWeight: 400 } as never)).toBeNull();
  });
});

describe("convertFigmaEffects", () => {
  it("emits a single object for one effect, an array for multiple", () => {
    const single = convertFigmaEffects([
      { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 2 }, radius: 4 },
    ]);
    expect(Array.isArray((single!.$value as unknown))).toBe(false);

    const multi = convertFigmaEffects([
      { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 2 }, radius: 4 },
      { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.05 }, offset: { x: 0, y: 8 }, radius: 16 },
    ]);
    expect(Array.isArray((multi!.$value as unknown))).toBe(true);
  });

  it("lifts INNER_SHADOW into the DTCG `inset: true` flag", () => {
    const out = convertFigmaEffects([
      { type: "INNER_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.2 }, offset: { x: 0, y: 1 }, radius: 2 },
    ]);
    expect((out!.$value as { inset: boolean }).inset).toBe(true);
  });

  it("ignores visible: false effects", () => {
    const out = convertFigmaEffects([
      { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 2 }, radius: 4, visible: false },
    ]);
    expect(out).toBeNull();
  });

  it("returns null when no DROP_SHADOW/INNER_SHADOW survives (LAYER_BLUR / BACKGROUND_BLUR aren't representable)", () => {
    expect(convertFigmaEffects([{ type: "LAYER_BLUR", radius: 8 }])).toBeNull();
    expect(convertFigmaEffects([{ type: "BACKGROUND_BLUR", radius: 12 }])).toBeNull();
  });
});
