import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { validateTheme, resolveTheme, lintTheme } from "@polymorph/core";
import { transformToDart } from "@polymorph/adapter-flutter";
import { transformToSwift } from "@polymorph/adapter-swift";
import { transformToKotlin } from "@polymorph/adapter-kotlin";
import type { ThemeMode } from "@polymorph/spec";
import { runInit } from "./commands/init.js";
import { runDiff } from "./commands/diff.js";
import { runMigrate } from "./commands/migrate.js";

const USAGE =
  "polymorph <command> [options]\n" +
  "  validate <file>                      schema + alias-graph check\n" +
  "  lint <file>                          advisory WCAG/motion/protected checks\n" +
  "  resolve <file>                       print the resolved theme as JSON\n" +
  "  transform <file>                     emit native source for a target\n" +
  "  init                                 scaffold a minimal valid theme\n" +
  "  diff <before> <after>                structural diff between two themes\n" +
  "  migrate <file>                       fill in missing required tokens + bump contractVersion\n" +
  "\n" +
  "  shared:        [--mode <light|dark|highContrast>] [--json]\n" +
  "  lint:          [--strict]\n" +
  "  transform:     --target <dart|swift|kotlin> [--class <Name>] [--output <path>]\n" +
  "  init/migrate:  [--output <path>]\n" +
  "  init:          [--modes <comma-separated>]";

interface Parsed {
  command?: string;
  positional: string[];
  mode: ThemeMode;
  strict: boolean;
  json: boolean;
  target?: string;
  className?: string;
  output?: string;
  modesList?: ThemeMode[];
}

function parse(argv: string[]): Parsed {
  const rest = [...argv];
  const command = rest.shift();
  const positional: string[] = [];
  let mode: ThemeMode = "light";
  let strict = false;
  let json = false;
  let target: string | undefined;
  let className: string | undefined;
  let output: string | undefined;
  let modesList: ThemeMode[] | undefined;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!;
    if (a === "--strict") strict = true;
    else if (a === "--json") json = true;
    else if (a === "--mode") mode = (rest[++i] as ThemeMode) ?? "light";
    else if (a.startsWith("--mode=")) mode = a.slice("--mode=".length) as ThemeMode;
    else if (a === "--modes") modesList = (rest[++i] ?? "").split(",").filter(Boolean) as ThemeMode[];
    else if (a.startsWith("--modes=")) modesList = a.slice("--modes=".length).split(",").filter(Boolean) as ThemeMode[];
    else if (a === "--target") target = rest[++i];
    else if (a.startsWith("--target=")) target = a.slice("--target=".length);
    else if (a === "--class") className = rest[++i];
    else if (a.startsWith("--class=")) className = a.slice("--class=".length);
    else if (a === "--output" || a === "-o") output = rest[++i];
    else if (a.startsWith("--output=")) output = a.slice("--output=".length);
    else if (!a.startsWith("-")) positional.push(a);
  }
  return { command, positional, mode, strict, json, target, className, output, modesList };
}

const printErrors = (errors: { code: string; tokenId?: string; path?: string; message: string }[]): void => {
  for (const e of errors) console.error(`✗ [${e.code}] ${e.tokenId ?? e.path ?? ""} ${e.message}`.replace(/\s+/g, " ").trim());
};

/** Run the CLI; returns the process exit code (no process.exit, so it is testable in-process). */
export async function run(argv: string[]): Promise<number> {
  const { command, positional, mode, strict, json, target, className, output, modesList } = parse(argv);

  if (!command || !["validate", "lint", "resolve", "transform", "init", "diff", "migrate"].includes(command)) {
    console.error(USAGE);
    return 2;
  }

  // `init` takes no positional file.
  if (command === "init") {
    const { exitCode, stdout } = runInit({ output, modes: modesList });
    if (stdout) process.stdout.write(stdout);
    return exitCode;
  }

  // `diff` takes two positional files.
  if (command === "diff") {
    if (positional.length !== 2) {
      console.error(`error: 'diff' takes exactly two files\n${USAGE}`);
      return 2;
    }
    const { exitCode } = runDiff({ beforePath: positional[0]!, afterPath: positional[1]!, json });
    return exitCode;
  }

  const file = positional[0];
  if (!file) {
    console.error(`error: missing <file>\n${USAGE}`);
    return 2;
  }

  if (command === "migrate") {
    const { exitCode } = runMigrate({ inputPath: file, output, json });
    return exitCode;
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

  // lint, resolve, and transform all require a valid theme
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
    if (command === "resolve") {
      console.log(JSON.stringify(resolveTheme(theme, mode), null, 2));
      return 0;
    }
    // transform
    if (target !== "dart" && target !== "swift" && target !== "kotlin") {
      console.error(`error: --target is required for transform; supported: dart, swift, kotlin`);
      return 2;
    }
    const source =
      target === "dart"
        ? transformToDart(theme, { mode, ...(className ? { className } : {}) })
        : target === "swift"
          ? transformToSwift(theme, { mode, ...(className ? { enumName: className } : {}) })
          : transformToKotlin(theme, { mode, ...(className ? { objectName: className } : {}) });
    if (output) {
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, source);
      console.log(`✓ wrote ${output} (${source.length} bytes)`);
    } else {
      console.log(source);
    }
    return 0;
  } catch (e) {
    console.error(`error: ${(e as Error).message}`);
    return 1;
  }
}
