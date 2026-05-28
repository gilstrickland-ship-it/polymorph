import { TOKENS, type SemanticTokenId, type ThemeMode } from "@polymorph/spec";
import { convertToDtcg } from "./convert.js";
import type {
  MappingConfig,
  TokensStudioExport,
  TokensStudioSet,
  TokensStudioToken,
} from "./types.js";

const MODE_SENSITIVE = new Map(TOKENS.map((t) => [t.id, t.modeSensitive]));
const TYPE_OF = new Map(TOKENS.map((t) => [t.id, t.type]));

const isToken = (v: unknown): v is TokensStudioToken =>
  !!v && typeof v === "object" && "value" in v && "type" in v;

/** Recursively flatten a Tokens Studio set into a path → token map. */
function flatten(into: Map<string, TokensStudioToken>, obj: TokensStudioSet, prefix: string): void {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    const path = prefix ? `${prefix}.${k}` : k;
    if (isToken(v)) {
      into.set(path, v);
    } else if (v && typeof v === "object") {
      flatten(into, v as TokensStudioSet, path);
    }
  }
}

/**
 * Merge enabled Tokens Studio sets in order — later sets override earlier ones at the same path
 * (matching Tokens Studio's stacking semantics).
 */
function resolveSets(input: TokensStudioExport, setNames: readonly string[]): Map<string, TokensStudioToken> {
  const map = new Map<string, TokensStudioToken>();
  for (const name of setNames) {
    const set = input[name];
    if (!set || typeof set !== "object") continue;
    flatten(map, set as TokensStudioSet, "");
  }
  return map;
}

/** Set a value at a dotted path inside a nested object, creating intermediate objects as needed. */
function setPath(root: Record<string, unknown>, segs: string[], leaf: unknown): void {
  let cur = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]!;
    if (!cur[seg] || typeof cur[seg] !== "object") cur[seg] = {};
    cur = cur[seg] as Record<string, unknown>;
  }
  cur[segs[segs.length - 1]!] = leaf;
}

export interface ImportReport {
  /** Polymorph ids that were successfully imported. */
  imported: SemanticTokenId[];
  /** Mapped Polymorph ids whose Tokens Studio token was not found in the resolved set. */
  missing: { id: SemanticTokenId; path: string; mode: ThemeMode | "invariant" }[];
  /** Mapped Polymorph ids whose Tokens Studio value couldn't be coerced to the contract type. */
  unconvertible: { id: SemanticTokenId; from: string; to: string; mode: ThemeMode | "invariant" }[];
}

export interface ImportResult {
  theme: { contractVersion: string; pm: Record<string, unknown>; [k: string]: unknown };
  report: ImportReport;
}

/**
 * Import a Tokens Studio export into a Polymorph theme using `mapping` to locate each Polymorph
 * semantic id within the export's token sets. Aliases inside the export are resolved during
 * conversion — the emitted theme uses concrete values (no `{…}` references remain).
 *
 * Returns the theme and a report listing imported / missing / unconvertible ids. The theme is not
 * validated here; the caller is expected to feed it to `@polymorph/core.validateTheme`.
 */
export function importTokensStudio(input: TokensStudioExport, mapping: MappingConfig): ImportResult {
  const pm: Record<string, unknown> = {};
  const report: ImportReport = { imported: [], missing: [], unconvertible: [] };

  const importInto = (
    targetGroup: Record<string, unknown>,
    registry: Map<string, TokensStudioToken>,
    ids: Partial<Record<SemanticTokenId, string>>,
    where: ThemeMode | "invariant",
  ): void => {
    for (const [pmId, tsPath] of Object.entries(ids) as [SemanticTokenId, string][]) {
      const token = registry.get(tsPath);
      if (!token) {
        report.missing.push({ id: pmId, path: tsPath, mode: where });
        continue;
      }
      const dtcgType = TYPE_OF.get(pmId);
      if (!dtcgType) continue; // not a known semantic id
      const converted = convertToDtcg(token, dtcgType, registry);
      if (!converted) {
        report.unconvertible.push({ id: pmId, from: token.type, to: dtcgType, mode: where });
        continue;
      }
      const segs = pmId.replace(/^pm\./, "").split(".");
      setPath(targetGroup, segs, converted);
      report.imported.push(pmId);
    }
  };

  // 1. Mode-invariant tokens go under `pm.*` directly.
  importInto(pm, resolveSets(input, mapping.invariant.sets), mapping.invariant.ids, "invariant");

  // 2. Mode-sensitive tokens go under `pm.modes.<mode>.*`.
  const modes: Record<string, unknown> = {};
  for (const mode of ["light", "dark", "highContrast"] as const) {
    const m = mapping.modes[mode];
    if (!m) continue;
    const modeGroup: Record<string, unknown> = {};
    importInto(modeGroup, resolveSets(input, m.sets), m.ids, mode);
    // Only emit the mode if any tokens landed in it.
    if (Object.keys(modeGroup).length > 0) modes[mode] = modeGroup;
  }
  if (Object.keys(modes).length > 0) pm.modes = modes;

  return { theme: { contractVersion: "0.0.0", pm }, report };
}

/** Convenience: throws if `mapping` lists a Polymorph id that isn't mode-sensitive in the mode
 *  block (or is mode-sensitive in the invariant block). Useful as a sanity check before import. */
export function lintMapping(mapping: MappingConfig): string[] {
  const errors: string[] = [];
  for (const id of Object.keys(mapping.invariant.ids) as SemanticTokenId[]) {
    if (MODE_SENSITIVE.get(id)) errors.push(`'${id}' is mode-sensitive — list it in modes, not invariant`);
  }
  for (const mode of ["light", "dark", "highContrast"] as const) {
    const m = mapping.modes[mode];
    if (!m) continue;
    for (const id of Object.keys(m.ids) as SemanticTokenId[]) {
      if (MODE_SENSITIVE.get(id) === false) errors.push(`'${id}' is mode-invariant — list it in invariant, not modes.${mode}`);
    }
  }
  return errors;
}
