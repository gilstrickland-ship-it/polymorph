/**
 * Regenerate every committed Dart golden under `tests/golden/`. Run after intentionally
 * changing the codegen or the bank themes.
 *
 *   pnpm --filter @polymorph/adapter-flutter update-goldens
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { ThemeMode } from "@polymorph/spec";
import { transformToDart } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const repoRoot = join(pkgRoot, "..", "..");
const goldenDir = join(pkgRoot, "tests", "golden");
mkdirSync(goldenDir, { recursive: true });

const loadBank = (name: "aurora" | "borealis"): unknown =>
  JSON.parse(readFileSync(join(repoRoot, "examples", `mock-bank-${name}`, "theme", `${name}.tokens.json`), "utf8"));

const banks = [
  { name: "aurora", theme: loadBank("aurora") },
  { name: "borealis", theme: loadBank("borealis") },
] as const;
const modes: ThemeMode[] = ["light", "dark"];

let count = 0;
for (const bank of banks) {
  for (const mode of modes) {
    const className = `${bank.name[0]!.toUpperCase()}${bank.name.slice(1)}Theme${mode[0]!.toUpperCase()}${mode.slice(1)}`;
    const dart = transformToDart(bank.theme, { mode, className });
    const path = join(goldenDir, `${bank.name}_${mode}.dart`);
    writeFileSync(path, dart);
    count++;
    console.log(`wrote ${bank.name}_${mode}.dart (${dart.length} bytes, class ${className})`);
  }
}
console.log(`done — ${count} goldens written to ${goldenDir}`);
