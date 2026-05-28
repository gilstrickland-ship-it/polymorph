import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateTheme, resolveTheme } from "@polymorph/core";
import { importTokensStudio, lintMapping } from "../src/index.js";
import type { MappingConfig, TokensStudioExport } from "../src/index.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const load = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;

const exportJson = load<TokensStudioExport>(join(fixtures, "tokens-studio.export.json"));
const mapping = load<MappingConfig>(join(fixtures, "mapping.json"));

describe("importTokensStudio — end-to-end against @polymorph/core", () => {
  const { theme, report } = importTokensStudio(exportJson, mapping);

  it("imports every mapped Polymorph id with no missing or unconvertible tokens", () => {
    expect(report.missing).toEqual([]);
    expect(report.unconvertible).toEqual([]);
    // Mode-sensitive ids are imported once per mode, so the event count is invariant + modes*ids.
    expect(report.imported.length).toBe(38 + 31 * 2);
    // …but the unique set of Polymorph ids reached is the full manifest (69).
    expect(new Set(report.imported).size).toBe(69);
  });

  it("produces a theme that validates against the contract", () => {
    const r = validateTheme(theme);
    expect(r.valid, JSON.stringify(r.errors.slice(0, 3))).toBe(true);
  });

  it("resolves cleanly for both declared modes", () => {
    const light = resolveTheme(theme, "light");
    const dark = resolveTheme(theme, "dark");
    expect(light.tokens["pm.color.surface.base"]).toBeTruthy();
    expect(dark.tokens["pm.color.surface.base"]).toBeTruthy();
    expect(light.tokens["pm.color.surface.base"]!.value).not.toEqual(dark.tokens["pm.color.surface.base"]!.value);
  });

  it("converts a Tokens Studio typography composite into the 5-property DTCG form", () => {
    const body = (resolveTheme(theme, "light").tokens["pm.typography.body"] as { value: Record<string, unknown> }).value;
    expect(body.fontFamily).toBe("Inter");
    expect(body.fontWeight).toBe(400);
    expect(body.fontSize).toEqual({ value: 16, unit: "px" });
    expect(body.lineHeight).toBe(1.4);
  });
});

describe("lintMapping", () => {
  it("rejects misplaced mode-sensitive ids in the invariant block", () => {
    const bad: MappingConfig = {
      invariant: { sets: ["global"], ids: { "pm.color.surface.base": "color.surface.base" } },
      modes: {},
    };
    expect(lintMapping(bad)).toEqual([
      "'pm.color.surface.base' is mode-sensitive — list it in modes, not invariant",
    ]);
  });
  it("accepts the generated fixture mapping", () => {
    expect(lintMapping(mapping)).toEqual([]);
  });
});
