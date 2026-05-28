import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  consolidateTokensStudioFiles,
  loadTokensStudioFromDirectory,
  importTokensStudio,
} from "../src/index.js";
import type { MappingConfig, TokensStudioExport } from "../src/index.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const load = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;

describe("consolidateTokensStudioFiles", () => {
  it("routes $themes / $metadata / regular sets into the TokensStudioExport shape", () => {
    const files = {
      "global.json": { color: { brand: { value: "#1f5cff", type: "color" } } },
      "light.json": { color: { bg: { value: "#ffffff", type: "color" } } },
      "$themes.json": [{ name: "Light", selectedTokenSets: { global: "enabled", light: "enabled" } }],
      "$metadata.json": { tokenSetOrder: ["global", "light"] },
    };
    const out = consolidateTokensStudioFiles(files);
    expect(out.global).toEqual(files["global.json"]);
    expect(out.light).toEqual(files["light.json"]);
    expect(out.$themes).toEqual(files["$themes.json"]);
    expect(out.$metadata).toEqual(files["$metadata.json"]);
  });

  it("accepts keys with or without `.json`", () => {
    const a = consolidateTokensStudioFiles({ "global.json": { x: {} } });
    const b = consolidateTokensStudioFiles({ global: { x: {} } });
    expect(a).toEqual(b);
  });

  it("ignores `$themes` whose value isn't an array (defensive)", () => {
    const out = consolidateTokensStudioFiles({ "$themes.json": "not an array" });
    expect(out.$themes).toBeUndefined();
  });
});

describe("loadTokensStudioFromDirectory", () => {
  it("loads the committed multi-file fixture and matches the in-memory consolidation", async () => {
    const fromDisk = await loadTokensStudioFromDirectory(join(fixtures, "multi-file"));
    const fromMem = consolidateTokensStudioFiles({
      "global.json": load(join(fixtures, "multi-file", "global.json")),
      "light.json": load(join(fixtures, "multi-file", "light.json")),
      "$themes.json": load(join(fixtures, "multi-file", "$themes.json")),
      "$metadata.json": load(join(fixtures, "multi-file", "$metadata.json")),
    });
    expect(fromDisk).toEqual(fromMem);

    // sanity-check: alias `{color.neutral.white}` resolves to "#ffffff" through the merged registry
    // by running a tiny import that maps a pm.* id to that aliased path.
    const mapping: MappingConfig = {
      invariant: { sets: ["global"], ids: { "pm.space.md": "spacing.md" } },
      modes: {
        light: { sets: ["global", "light"], ids: { "pm.color.surface.base": "color.background" } },
      },
    };
    const { theme, report } = importTokensStudio(fromDisk, mapping);
    expect(report.missing).toEqual([]);
    expect(report.unconvertible).toEqual([]);
    // deep traversal in a test — cast at the boundary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const surfaceBase = (theme as any).pm.modes.light.color.surface.base.$value;
    expect(surfaceBase).toBe("#ffffff");
  });
});

describe("round-trip: split the big single-file fixture and reconsolidate", () => {
  it("consolidating split files reproduces the original single-file shape", () => {
    const original = load<TokensStudioExport>(join(fixtures, "tokens-studio.export.json"));
    // Split into a files-map: each top-level key becomes its own "<name>.json".
    const files: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(original)) {
      files[`${k}.json`] = v;
    }
    expect(consolidateTokensStudioFiles(files)).toEqual(original);
  });
});
