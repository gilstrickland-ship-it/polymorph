// `polymorph diff` — structural diff between two theme files.
//
// Walks the `pm.*` subtree of each side and reports added / removed / changed authored
// tokens by dotted path. Comparison is by structural equality of `{$type, $value}` — same
// shape the editor in @polymorph/builder uses for its `changedTokenIds` set, so the diff
// terminology is consistent across the toolchain.

import { readFileSync } from "node:fs";

export type ChangeKind = "added" | "removed" | "changed";

export interface ThemeDiffEntry {
  kind: ChangeKind;
  path: string;
  /** Before value (undefined for `added`). */
  before?: unknown;
  /** After value (undefined for `removed`). */
  after?: unknown;
}

export interface ThemeDiff {
  entries: ThemeDiffEntry[];
}

function isAuthoredToken(n: unknown): boolean {
  return !!n && typeof n === "object" && "$type" in (n as object) && "$value" in (n as object);
}

function walkTokens(root: unknown, into: Map<string, unknown>, prefix: string[] = []): void {
  if (!root || typeof root !== "object" || Array.isArray(root)) return;
  if (isAuthoredToken(root)) {
    into.set(prefix.join("."), root);
    return;
  }
  for (const [k, v] of Object.entries(root)) walkTokens(v, into, [...prefix, k]);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
  }
  return true;
}

/**
 * Compare two themes and return the changed token paths. Pure: takes the parsed JSON
 * (not paths) so callers can compose against in-memory themes (e.g. before/after a
 * `runMigrate` pass).
 */
export function diffThemes(before: unknown, after: unknown): ThemeDiff {
  const beforeMap = new Map<string, unknown>();
  const afterMap = new Map<string, unknown>();
  walkTokens((before as Record<string, unknown> | undefined)?.pm, beforeMap);
  walkTokens((after as Record<string, unknown> | undefined)?.pm, afterMap);

  const entries: ThemeDiffEntry[] = [];
  const allKeys = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const sorted = [...allKeys].sort();
  for (const path of sorted) {
    const b = beforeMap.get(path);
    const a = afterMap.get(path);
    if (b === undefined && a !== undefined) entries.push({ kind: "added", path, after: a });
    else if (b !== undefined && a === undefined) entries.push({ kind: "removed", path, before: b });
    else if (b !== undefined && a !== undefined && !deepEqual(b, a)) {
      entries.push({ kind: "changed", path, before: b, after: a });
    }
  }
  return { entries };
}

export interface DiffOpts {
  beforePath: string;
  afterPath: string;
  json?: boolean;
}

export function runDiff(opts: DiffOpts): { exitCode: number } {
  let before: unknown;
  let after: unknown;
  try {
    before = JSON.parse(readFileSync(opts.beforePath, "utf8"));
  } catch (e) {
    console.error(`error: cannot read/parse ${opts.beforePath}: ${(e as Error).message}`);
    return { exitCode: 2 };
  }
  try {
    after = JSON.parse(readFileSync(opts.afterPath, "utf8"));
  } catch (e) {
    console.error(`error: cannot read/parse ${opts.afterPath}: ${(e as Error).message}`);
    return { exitCode: 2 };
  }

  const diff = diffThemes(before, after);
  if (opts.json) {
    console.log(JSON.stringify(diff, null, 2));
    return { exitCode: diff.entries.length === 0 ? 0 : 1 };
  }

  if (diff.entries.length === 0) {
    console.log(`✓ themes are identical (${opts.beforePath} ≡ ${opts.afterPath})`);
    return { exitCode: 0 };
  }
  console.log(`${diff.entries.length} change(s):`);
  for (const e of diff.entries) {
    if (e.kind === "added") console.log(`  + ${e.path} = ${JSON.stringify((e.after as { $value?: unknown })?.$value)}`);
    else if (e.kind === "removed") console.log(`  - ${e.path}`);
    else console.log(`  ~ ${e.path}: ${JSON.stringify((e.before as { $value?: unknown })?.$value)} → ${JSON.stringify((e.after as { $value?: unknown })?.$value)}`);
  }
  return { exitCode: 1 };
}
