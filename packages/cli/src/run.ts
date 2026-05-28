import { readFileSync } from "node:fs";
import { validateTheme, resolveTheme, lintTheme } from "@polymorph/core";
import type { ThemeMode } from "@polymorph/spec";

const USAGE =
  "polymorph <validate|lint|resolve> <file> [--mode <light|dark|highContrast>] [--strict] [--json]";

interface Parsed {
  command?: string;
  file?: string;
  mode: ThemeMode;
  strict: boolean;
  json: boolean;
}

function parse(argv: string[]): Parsed {
  const rest = [...argv];
  const command = rest.shift();
  let file: string | undefined;
  let mode: ThemeMode = "light";
  let strict = false;
  let json = false;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!;
    if (a === "--strict") strict = true;
    else if (a === "--json") json = true;
    else if (a === "--mode") mode = (rest[++i] as ThemeMode) ?? "light";
    else if (a.startsWith("--mode=")) mode = a.slice("--mode=".length) as ThemeMode;
    else if (!a.startsWith("-") && !file) file = a;
  }
  return { command, file, mode, strict, json };
}

const printErrors = (errors: { code: string; tokenId?: string; path?: string; message: string }[]): void => {
  for (const e of errors) console.error(`✗ [${e.code}] ${e.tokenId ?? e.path ?? ""} ${e.message}`.replace(/\s+/g, " ").trim());
};

/** Run the CLI; returns the process exit code (no process.exit, so it is testable in-process). */
export async function run(argv: string[]): Promise<number> {
  const { command, file, mode, strict, json } = parse(argv);

  if (!command || !["validate", "lint", "resolve", "transform"].includes(command)) {
    console.error(USAGE);
    return 2;
  }
  if (command === "transform") {
    console.error("transform: not yet implemented (post-v1, via Style Dictionary)");
    return 1;
  }
  if (!file) {
    console.error(`error: missing <file>\n${USAGE}`);
    return 2;
  }

  let theme: unknown;
  try {
    theme = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`error: cannot read/parse ${file}: ${(e as Error).message}`);
    return 2;
  }

  const result = validateTheme(theme);

  if (command === "validate") {
    if (result.valid) {
      console.log(json ? JSON.stringify(result) : `✓ ${file} is valid`);
      return 0;
    }
    if (json) console.log(JSON.stringify(result));
    else printErrors(result.errors);
    return 1;
  }

  // lint and resolve require a valid theme
  if (!result.valid) {
    printErrors(result.errors);
    return 1;
  }

  try {
    if (command === "lint") {
      const warnings = lintTheme(resolveTheme(theme, mode));
      if (json) console.log(JSON.stringify(warnings));
      else if (warnings.length === 0) console.log("✓ no advisory warnings");
      else for (const w of warnings) console.error(`⚠ [${w.code}] ${w.message}`);
      return strict && warnings.length > 0 ? 1 : 0;
    }
    // resolve
    console.log(JSON.stringify(resolveTheme(theme, mode), null, 2));
    return 0;
  } catch (e) {
    console.error(`error: ${(e as Error).message}`);
    return 1;
  }
}
