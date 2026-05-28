import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { run } from "../src/run.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "..", "..", "spec", "tests", "fixtures");
const valid = join(fixtures, "valid", "light-dark.tokens.json");
const invalid = join(fixtures, "invalid", "missing-required.tokens.json");

let logs: string[];
let errs: string[];
beforeEach(() => {
  logs = [];
  errs = [];
  vi.spyOn(console, "log").mockImplementation((...a) => void logs.push(a.join(" ")));
  vi.spyOn(console, "error").mockImplementation((...a) => void errs.push(a.join(" ")));
});
afterEach(() => vi.restoreAllMocks());

describe("polymorph CLI", () => {
  it("validate: exit 0 on a valid theme, 1 on an invalid one", async () => {
    expect(await run(["validate", valid])).toBe(0);
    expect(await run(["validate", invalid])).toBe(1);
    expect(errs.join("\n")).toContain("SCHEMA_INVALID");
  });

  it("resolve: prints parseable ResolvedTheme JSON for the requested mode", async () => {
    const code = await run(["resolve", valid, "--mode", "dark"]);
    expect(code).toBe(0);
    const parsed = JSON.parse(logs.join("\n"));
    expect(parsed.mode).toBe("dark");
    expect(parsed.tokens["pm.color.surface.base"]).toBeTruthy();
  });

  it("lint: exit 0 by default even with warnings; 1 with --strict", async () => {
    expect(await run(["lint", valid])).toBe(0); // light-dark has advisory warnings (8px target)
    expect(await run(["lint", valid, "--strict"])).toBe(1);
  });

  it("usage error (no command) exits 2; missing file exits 2", async () => {
    expect(await run([])).toBe(2);
    expect(await run(["validate"])).toBe(2);
  });

  describe("transform", () => {
    it("--target dart emits Dart source for the requested mode", async () => {
      const code = await run(["transform", valid, "--target", "dart", "--mode", "light", "--class", "Probe"]);
      expect(code).toBe(0);
      const dart = logs.join("\n");
      expect(dart).toContain("class Probe {");
      expect(dart).toMatch(/static const Color colorSurfaceBase = Color\(0x[0-9A-F]{8}\);/);
      expect(dart).toContain("static ThemeData buildThemeData()");
    });

    it("--target is required (otherwise exit 2 with a hint)", async () => {
      expect(await run(["transform", valid])).toBe(2);
      expect(errs.join("\n")).toContain("--target is required");
    });

    it("rejects an invalid theme (exit 1)", async () => {
      expect(await run(["transform", invalid, "--target", "dart"])).toBe(1);
      expect(errs.join("\n")).toContain("SCHEMA_INVALID");
    });
  });
});
