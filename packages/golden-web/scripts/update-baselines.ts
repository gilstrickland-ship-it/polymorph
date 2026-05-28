/**
 * Regenerate every committed golden baseline. Run after intentionally changing a scenario, the
 * bank themes, or the contract output (and review the resulting PNG diff in the PR).
 *
 *   pnpm --filter @polymorph/golden-web update-baselines
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createWebGoldenHarness, DEFAULT_SCENARIOS, type WebGoldenPayload } from "../src/index.js";
import type { ThemeMode } from "@polymorph/spec";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const repoRoot = join(pkgRoot, "..", "..");
const baselineDir = join(pkgRoot, "baselines");
mkdirSync(baselineDir, { recursive: true });

const loadBank = (name: "aurora" | "borealis"): unknown =>
  JSON.parse(readFileSync(join(repoRoot, "examples", `mock-bank-${name}`, "theme", `${name}.tokens.json`), "utf8"));

const harness = createWebGoldenHarness({ baselineDir, update: true });
const banks = [
  { name: "aurora", theme: loadBank("aurora") },
  { name: "borealis", theme: loadBank("borealis") },
] as const;
const modes: ThemeMode[] = ["light", "dark"];

let count = 0;
for (const scenario of DEFAULT_SCENARIOS) {
  for (const bank of banks) {
    for (const mode of modes) {
      const name = `${scenario.name}-${bank.name}-${mode}`;
      const payload: WebGoldenPayload = { scenario, theme: bank.theme, mode };
      const png = await harness.capture(name, payload);
      writeFileSync(join(baselineDir, `${name}.png`), Buffer.from(png));
      count++;
      console.log(`wrote ${name}.png (${png.length} bytes)`);
    }
  }
}
console.log(`done — ${count} baselines written to ${baselineDir}`);
