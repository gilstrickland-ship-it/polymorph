import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const testsDir = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(testsDir, "..");
const specFixtures = join(pkgRoot, "..", "spec", "tests", "fixtures");

const read = (p: string): unknown => JSON.parse(readFileSync(p, "utf8"));

export function specFixture(kind: "valid" | "invalid", name: string): unknown {
  return read(join(specFixtures, kind, `${name}.tokens.json`));
}

export function coreFixture(name: string): unknown {
  return read(join(testsDir, "fixtures", `${name}.tokens.json`));
}
