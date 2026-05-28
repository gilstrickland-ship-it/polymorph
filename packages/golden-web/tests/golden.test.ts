import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createWebGoldenHarness, accountCardScenario, diffPngs, type WebGoldenPayload } from "../src/index.js";
import type { ThemeMode } from "@polymorph/spec";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const repoRoot = join(pkgRoot, "..", "..");
const baselineDir = join(pkgRoot, "baselines");

const loadBank = (name: "aurora" | "borealis"): unknown =>
  JSON.parse(readFileSync(join(repoRoot, "examples", `mock-bank-${name}`, "theme", `${name}.tokens.json`), "utf8"));

const banks = [
  { name: "aurora", theme: loadBank("aurora") },
  { name: "borealis", theme: loadBank("borealis") },
] as const;
const modes: ThemeMode[] = ["light", "dark"];

const harness = createWebGoldenHarness({ baselineDir });

describe("golden web — same SDK, two banks, two modes", () => {
  for (const bank of banks) {
    for (const mode of modes) {
      const name = `${accountCardScenario.name}-${bank.name}-${mode}`;
      it(`${name} matches its baseline`, async () => {
        const payload: WebGoldenPayload = { scenario: accountCardScenario, theme: bank.theme, mode };
        const png = await harness.capture(name, payload);
        const result = await harness.compare(name, png);
        expect(result.match, `diffRatio=${result.diffRatio}`).toBe(true);
      });
    }
  }
});

describe("golden web — banks render distinctly", () => {
  it("Aurora and Borealis light produce visibly different PNGs (the re-skin is real)", async () => {
    const aurora = await harness.capture("x", {
      scenario: accountCardScenario,
      theme: banks[0].theme,
      mode: "light",
    });
    const borealis = await harness.capture("x", {
      scenario: accountCardScenario,
      theme: banks[1].theme,
      mode: "light",
    });
    const result = diffPngs(Buffer.from(aurora), Buffer.from(borealis), 0); // any diff at all
    expect(result.match).toBe(false);
    // The two banks should differ on a meaningful fraction of pixels (background, button, etc.).
    expect(result.diffRatio).toBeGreaterThan(0.05);
  });

  it("light and dark for the same bank also produce visibly different PNGs", async () => {
    const light = await harness.capture("x", { scenario: accountCardScenario, theme: banks[0].theme, mode: "light" });
    const dark = await harness.capture("x", { scenario: accountCardScenario, theme: banks[0].theme, mode: "dark" });
    expect(diffPngs(Buffer.from(light), Buffer.from(dark), 0).diffRatio).toBeGreaterThan(0.05);
  });
});

describe("createWebGoldenHarness — surface checks", () => {
  it("capture validates the payload shape", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(harness.capture("x", {} as any)).rejects.toThrow(/WebGoldenPayload/);
  });

  it("compare reports a non-match for a missing baseline (no update)", async () => {
    const png = await harness.capture("x", { scenario: accountCardScenario, theme: banks[0].theme, mode: "light" });
    const result = await harness.compare("a-baseline-that-does-not-exist", png);
    expect(result.match).toBe(false);
    expect(result.diffRatio).toBe(1);
  });
});
