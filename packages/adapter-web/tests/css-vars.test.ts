import { describe, it, expect } from "vitest";
import { toCssVarName, toCssEntries, toCssVariables, toCssVariablesString } from "../src/css-vars.js";
import { makeResolved } from "./helpers.js";

describe("toCssVarName", () => {
  it("converts a semantic id to a CSS custom-property name", () => {
    expect(toCssVarName("pm.color.surface.base")).toBe("--pm-color-surface-base");
    expect(toCssVarName("pm.color.action.primary.rest")).toBe("--pm-color-action-primary-rest");
  });
});

describe("toCssEntries — per type", () => {
  it("color → string passthrough", () => {
    expect(toCssEntries("pm.color.text.body", "color", "#112233")).toEqual([
      ["--pm-color-text-body", "#112233"],
    ]);
  });
  it("dimension → `${value}${unit}`", () => {
    expect(toCssEntries("pm.space.md", "dimension", { value: 16, unit: "px" })).toEqual([
      ["--pm-space-md", "16px"],
    ]);
  });
  it("duration → `${value}${unit}`", () => {
    expect(toCssEntries("pm.motion.duration.base", "duration", { value: 220, unit: "ms" })).toEqual([
      ["--pm-motion-duration-base", "220ms"],
    ]);
  });
  it("number → string", () => {
    expect(toCssEntries("pm.opacity.disabled", "number", 0.4)).toEqual([["--pm-opacity-disabled", "0.4"]]);
  });
  it("cubicBezier → cubic-bezier(...)", () => {
    expect(toCssEntries("pm.motion.easing.standard", "cubicBezier", [0.4, 0, 0.2, 1])).toEqual([
      ["--pm-motion-easing-standard", "cubic-bezier(0.4, 0, 0.2, 1)"],
    ]);
  });
  it("shadow → CSS box-shadow string", () => {
    const value = {
      color: "#00000022",
      offsetX: { value: 0, unit: "px" },
      offsetY: { value: 1, unit: "px" },
      blur: { value: 2, unit: "px" },
      spread: { value: 0, unit: "px" },
    };
    expect(toCssEntries("pm.elevation.raised", "shadow", value)).toEqual([
      ["--pm-elevation-raised", "0px 1px 2px 0px #00000022"],
    ]);
  });
  it("shadow array → comma-separated", () => {
    const value = [
      { color: "#000", offsetX: { value: 0, unit: "px" }, offsetY: { value: 1, unit: "px" }, blur: { value: 2, unit: "px" }, spread: { value: 0, unit: "px" } },
      { color: "#001", offsetX: { value: 0, unit: "px" }, offsetY: { value: 4, unit: "px" }, blur: { value: 8, unit: "px" }, spread: { value: 0, unit: "px" } },
    ];
    expect(toCssEntries("pm.elevation.overlay", "shadow", value)[0]![1]).toBe(
      "0px 1px 2px 0px #000, 0px 4px 8px 0px #001",
    );
  });
  it("typography → 5 sub-variables (one per CSS sub-property)", () => {
    const value = {
      fontFamily: "Inter",
      fontWeight: 400,
      fontSize: { value: 16, unit: "px" },
      lineHeight: 1.4,
      letterSpacing: { value: 0, unit: "px" },
    };
    const entries = toCssEntries("pm.typography.body", "typography", value);
    const map = Object.fromEntries(entries);
    expect(map["--pm-typography-body-font-family"]).toBe("Inter");
    expect(map["--pm-typography-body-font-weight"]).toBe("400");
    expect(map["--pm-typography-body-font-size"]).toBe("16px");
    expect(map["--pm-typography-body-line-height"]).toBe("1.4");
    expect(map["--pm-typography-body-letter-spacing"]).toBe("0px");
  });
});

describe("toCssVariables / toCssVariablesString (over a real resolved theme)", () => {
  const rt = makeResolved("light");

  it("flattens every present token into the CSS-var record", () => {
    const vars = toCssVariables(rt);
    expect(vars["--pm-color-surface-base"]).toBeTruthy();
    expect(vars["--pm-color-action-primary-rest"]).toBeTruthy();
    expect(vars["--pm-space-md"]).toMatch(/^\d+(\.\d+)?px$/);
    // typography composite expanded to sub-properties
    expect(vars["--pm-typography-body-font-size"]).toBeTruthy();
  });

  it("renders a stylesheet body under the requested selector", () => {
    const css = toCssVariablesString(rt, ".aurora");
    expect(css.startsWith(".aurora {")).toBe(true);
    expect(css).toMatch(/--pm-color-surface-base: \S+;/);
    expect(css.endsWith("}")).toBe(true);
  });

  it("defaults to :root", () => {
    expect(toCssVariablesString(rt).startsWith(":root {")).toBe(true);
  });
});
