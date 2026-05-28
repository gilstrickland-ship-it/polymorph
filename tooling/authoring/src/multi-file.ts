import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { TokensStudioExport, TokensStudioSet, TokensStudioTheme } from "./types.js";

const stripJson = (name: string): string => name.replace(/\.json$/i, "");

/**
 * Consolidate a Tokens Studio **multi-file** export (one JSON per set + `$themes.json` +
 * `$metadata.json`) into the single-file `TokensStudioExport` shape, ready to feed
 * `importTokensStudio`.
 *
 * `files` is keyed by filename (with or without `.json`). Recognized special files:
 *   - `$themes.json`  — value is the themes array.
 *   - `$metadata.json` — value is the metadata object.
 * Every other key is treated as a token set named after the file (sans `.json`).
 */
export function consolidateTokensStudioFiles(files: Record<string, unknown>): TokensStudioExport {
  const out: TokensStudioExport = {};
  for (const [rawName, contents] of Object.entries(files)) {
    const name = stripJson(rawName);
    if (name === "$themes") {
      if (Array.isArray(contents)) out.$themes = contents as TokensStudioTheme[];
      continue;
    }
    if (name === "$metadata") {
      if (contents && typeof contents === "object") out.$metadata = contents as TokensStudioExport["$metadata"];
      continue;
    }
    if (contents && typeof contents === "object") out[name] = contents as TokensStudioSet;
  }
  return out;
}

/**
 * Read a directory of Tokens Studio JSON files and consolidate them via
 * `consolidateTokensStudioFiles`. Non-recursive; only top-level `*.json` files are read.
 */
export async function loadTokensStudioFromDirectory(dir: string): Promise<TokensStudioExport> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: Record<string, unknown> = {};
  for (const e of entries) {
    if (!e.isFile() || !e.name.toLowerCase().endsWith(".json")) continue;
    files[e.name] = JSON.parse(await readFile(join(dir, e.name), "utf8"));
  }
  return consolidateTokensStudioFiles(files);
}
