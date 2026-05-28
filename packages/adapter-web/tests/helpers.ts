import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveTheme } from "@polymorph/core";
import type { ResolvedTheme, ThemeMode } from "@polymorph/spec";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, "..", "..", "spec", "tests", "fixtures", "valid", "light-dark.tokens.json");

export function makeResolved(mode: ThemeMode = "light"): ResolvedTheme {
  return resolveTheme(JSON.parse(readFileSync(fixture, "utf8")), mode);
}
