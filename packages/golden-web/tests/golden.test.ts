import { describe, it, expect } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  createWebGoldenHarness,
  accountCardScenario,
  diffPngs,
  renderScenarioToPng,
  type WebGoldenPayload,
} from "../src/index.js";
import type { ThemeMode } from "@polymorph/spec";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const repoRoot = join(pkgRoot, "..", "..");
const baselineDir = join(pkgRoot, "baselines");
/** Diff artifacts written here on failure; CI uploads the directory so reviewers can see them. */
const diffsDir = join(pkgRoot, "__diffs__");

const loadBank = (name: "aurora" | "borealis"): unknown =>
  JSON.parse(readFileSync(join(repoRoot, "examples", `mock-bank-${name}`, "theme", `${name}.tokens.json`), "utf8"));

const banks = [
  { name: "aurora", theme: loadBank("aurora") },
  { name: "borealis", theme: loadBank("borealis") },
] as const;
const modes: ThemeMode[] = ["light", "dark"];

const harness = createWebGoldenHarness({ baselineDir });

/**
 * Run the harness for `name` and assert match. On failure, write the actual capture, the
 * baseline that was compared against, and the diff visualisation into `__diffs__/` so CI can
 * upload them as artifacts (and so a local run lets you see the change immediately).
 */
async function verifyGolden(name: string, payload: WebGoldenPayload): Promise<void> {
  const actual = await harness.capture(name, payload);
  const result = await harness.compare(name, actual);
  if (!result.match) {
    mkdirSync(diffsDir, { recursive: true });
    writeFileSync(join(diffsDir, `${name}.actual.png`), Buffer.from(actual));
    const baselinePath = join(baselineDir, `${name}.png`);
    if (existsSync(baselinePath)) {
      writeFileSync(join(diffsDir, `${name}.baseline.png`), readFileSync(baselinePath));
    }
    if (result.diffPng) writeFileSync(join(diffsDir, `${name}.diff.png`), Buffer.from(result.diffPng));
  }
  expect(
    result.match,
    `diffRatio=${result.diffRatio.toFixed(4)} — see packages/golden-web/__diffs__/${name}.{actual,baseline,diff}.png`,
  ).toBe(true);
}

describe("golden web — same SDK, two banks, two modes", () => {
  for (const bank of banks) {
    for (const mode of modes) {
      const name = `${accountCardScenario.name}-${bank.name}-${mode}`;
      it(`${name} matches its baseline`, async () => {
        await verifyGolden(name, { scenario: accountCardScenario, theme: bank.theme, mode });
      });
    }
  }
});

describe("golden web — banks render distinctly", () => {
  it("Aurora and Borealis light produce visibly different PNGs (the re-skin is real)", async () => {
    const aurora = await harness.capture("x", { scenario: accountCardScenario, theme: banks[0].theme, mode: "light" });
    const borealis = await harness.capture("x", { scenario: accountCardScenario, theme: banks[1].theme, mode: "light" });
    const result = diffPngs(Buffer.from(aurora), Buffer.from(borealis), 0);
    expect(result.match).toBe(false);
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

  it("compare surfaces a diffPng visualisation when the baseline differs (CI-artifact signal)", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "polymorph-golden-"));
    try {
      // Two distinct banks → known-different PNGs. Plant one as the baseline, compare the other.
      const auroraPng = await renderScenarioToPng(accountCardScenario, banks[0].theme, "light");
      const borealisPng = await renderScenarioToPng(accountCardScenario, banks[1].theme, "light");
      writeFileSync(join(tmp, "case.png"), borealisPng);

      const probe = createWebGoldenHarness({ baselineDir: tmp });
      const result = await probe.compare("case", auroraPng);

      expect(result.match).toBe(false);
      expect(result.diffRatio).toBeGreaterThan(0.05);
      expect(result.diffPng).toBeInstanceOf(Uint8Array);
      expect((result.diffPng as Uint8Array).length).toBeGreaterThan(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
