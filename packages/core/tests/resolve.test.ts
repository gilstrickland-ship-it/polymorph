import { describe, it, expect } from "vitest";
import { resolveTheme, declaredModes } from "../src/resolve.js";
import { ResolveError } from "../src/errors.js";
import { specFixture } from "./helpers.js";

const hasAlias = (v: unknown): boolean =>
  typeof v === "string" ? /^\{.+\}$/.test(v) : false;

describe("resolveTheme", () => {
  it("resolves required tokens to concrete values with no aliases remaining", () => {
    const rt = resolveTheme(specFixture("valid", "light-dark"), "dark");
    expect(rt.mode).toBe("dark");
    expect(rt.tokens["pm.color.surface.base"]).toBeTruthy();
    for (const t of Object.values(rt.tokens)) expect(hasAlias(t!.value)).toBe(false);
  });

  it("selects mode-sensitive values per mode and shares mode-invariant tokens", () => {
    const theme = specFixture("valid", "light-dark") as any;
    theme.pm.modes.light.color.surface.base.$value = "#ffffff";
    theme.pm.modes.dark.color.surface.base.$value = "#000000";

    const light = resolveTheme(theme, "light");
    const dark = resolveTheme(theme, "dark");
    expect(light.tokens["pm.color.surface.base"]!.value).toBe("#ffffff");
    expect(dark.tokens["pm.color.surface.base"]!.value).toBe("#000000");
    // mode-invariant (space.md) identical across modes
    expect(light.tokens["pm.space.md"]!.value).toEqual(dark.tokens["pm.space.md"]!.value);
  });

  it("resolves aliases to their primitive's concrete value", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.palette = { brand: { $type: "color", $value: "#abcdef" } };
    theme.pm.modes.light.color.surface.base.$value = "{palette.brand}";
    const rt = resolveTheme(theme, "light");
    expect(rt.tokens["pm.color.surface.base"]!.value).toBe("#abcdef");
  });

  it("resolves component props: override wins, else defaultsFrom", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    // no override → button.primary.radius falls back to pm.radius.control
    const fallback = resolveTheme(theme, "light");
    expect(fallback.components["button.primary"]!.radius).toEqual(
      fallback.tokens["pm.radius.control"]!.value,
    );
    // with override → uses the override value
    theme.pm.button = { primary: { radius: { $type: "dimension", $value: { value: 99, unit: "px" } } } };
    const overridden = resolveTheme(theme, "light");
    expect(overridden.components["button.primary"]!.radius).toEqual({ value: 99, unit: "px" });
  });

  it("throws on an undeclared mode", () => {
    expect(() => resolveTheme(specFixture("valid", "minimal-light"), "dark")).toThrow(ResolveError);
    expect(declaredModes(specFixture("valid", "minimal-light"))).toEqual(["light"]);
  });
});
