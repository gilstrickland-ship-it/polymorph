import { TOKENS, type SemanticTokenId, type ThemeMode } from "@polymorph/spec";
import type { ImportReport, ImportResult } from "./tokens-studio.js";

const MODE_SENSITIVE = new Map(TOKENS.map((t) => [t.id, t.modeSensitive]));
const TYPE_OF = new Map(TOKENS.map((t) => [t.id, t.type]));

// --- Figma REST API shape (GET /v1/files/:fileKey/variables/local) -----------

export interface FigmaVariableColorValue {
  r: number;
  g: number;
  b: number;
  a?: number;
}
export interface FigmaVariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}
export type FigmaVariableValue =
  | FigmaVariableColorValue
  | number
  | string
  | boolean
  | FigmaVariableAlias;

export type FigmaVariableResolvedType = "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";

export interface FigmaVariable {
  id: string;
  name: string;
  variableCollectionId: string;
  resolvedType: FigmaVariableResolvedType;
  valuesByMode: Record<string, FigmaVariableValue>;
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  defaultModeId: string;
  modes: { modeId: string; name: string }[];
}

export interface FigmaVariablesResponse {
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}

// --- Mapping (FI-supplied) ---------------------------------------------------

export interface FigmaMapping {
  /** Polymorph semantic id → Figma variable name (e.g. "color/surface/base"). */
  ids: Partial<Record<SemanticTokenId, string>>;
  /** Polymorph mode → Figma mode name (e.g. "Light", "Dark"). */
  modes: Partial<Record<ThemeMode, string>>;
  /** Optional: restrict to this variable collection by name. Else uses the first encountered. */
  collection?: string;
}

// --- helpers -----------------------------------------------------------------

const isAlias = (v: unknown): v is FigmaVariableAlias =>
  !!v && typeof v === "object" && (v as FigmaVariableAlias).type === "VARIABLE_ALIAS";

const isColor = (v: unknown): v is FigmaVariableColorValue =>
  !!v && typeof v === "object" && "r" in v && "g" in v && "b" in v;

/** Figma color (0…1 channels) → `#rrggbb`. Alpha < 1 → `#rrggbbaa`. */
export function figmaColorToHex(c: FigmaVariableColorValue): string {
  const ch = (n: number): string =>
    Math.max(0, Math.min(255, Math.round(n * 255))).toString(16).padStart(2, "0");
  const a = c.a ?? 1;
  const hex = `#${ch(c.r)}${ch(c.g)}${ch(c.b)}`;
  return a < 1 ? `${hex}${ch(a)}` : hex;
}

/** Resolve VARIABLE_ALIAS chains; throws on cycle or missing target. */
export function resolveAlias(
  value: FigmaVariableValue,
  modeId: string,
  vars: Record<string, FigmaVariable>,
  visiting: Set<string> = new Set(),
): FigmaVariableValue {
  if (!isAlias(value)) return value;
  if (visiting.has(value.id)) throw new Error(`alias cycle through ${value.id}`);
  const target = vars[value.id];
  if (!target) throw new Error(`alias references unknown variable id: ${value.id}`);
  // Prefer the target's value at the same mode id; fall back to the target's own default
  // (its collection's first mode) when the id doesn't exist in the target's `valuesByMode`.
  const next = target.valuesByMode[modeId] ?? target.valuesByMode[Object.keys(target.valuesByMode)[0]!];
  if (next === undefined) throw new Error(`variable ${target.name} has no value for mode ${modeId}`);
  return resolveAlias(next, modeId, vars, new Set(visiting).add(value.id));
}

function setPath(root: Record<string, unknown>, segs: string[], leaf: unknown): void {
  let cur = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]!;
    if (!cur[seg] || typeof cur[seg] !== "object") cur[seg] = {};
    cur = cur[seg] as Record<string, unknown>;
  }
  cur[segs[segs.length - 1]!] = leaf;
}

interface DtcgToken {
  $type: string;
  $value: unknown;
}

/**
 * Convert a (resolved) Figma variable value to a DTCG token of the requested target type.
 * Returns `null` if the value can't be coerced. Figma Variables only carries COLOR / FLOAT /
 * STRING / BOOLEAN — typography / shadow / cubicBezier come from other Figma surfaces.
 */
export function convertFigmaValue(value: FigmaVariableValue, targetType: string): DtcgToken | null {
  switch (targetType) {
    case "color":
      return isColor(value) ? { $type: "color", $value: figmaColorToHex(value) } : null;
    case "dimension":
      return typeof value === "number" ? { $type: "dimension", $value: { value, unit: "px" } } : null;
    case "number":
      return typeof value === "number" ? { $type: "number", $value: value } : null;
    case "duration":
      return typeof value === "number" ? { $type: "duration", $value: { value, unit: "ms" } } : null;
    default:
      return null; // typography / shadow / cubicBezier — not representable as a single Figma Variable
  }
}

// --- importer ----------------------------------------------------------------

/**
 * Import a Figma Variables REST-API response into a Polymorph theme using `mapping` to locate
 * each Polymorph semantic id within the Figma variable set. Aliases are resolved eagerly to
 * concrete values, matching the Tokens Studio importer's behaviour.
 *
 * Returns the theme and a report listing imported / missing / unconvertible ids. The theme is
 * not validated here; the caller is expected to feed it to `@polymorph/core.validateTheme`.
 *
 * Scope notes:
 *  - Only `color`, `dimension`, `number`, and `duration` tokens are importable from Figma
 *    Variables (the REST API's only typed scalars). Typography, shadow, and cubicBezier come
 *    from Figma Text Styles / Effect Styles — out of scope for this importer.
 *  - Multi-collection files: the importer uses the first encountered collection unless
 *    `mapping.collection` is set. Mode names are looked up inside that collection.
 */
export function importFigmaVariables(
  response: FigmaVariablesResponse,
  mapping: FigmaMapping,
): ImportResult {
  const pm: Record<string, unknown> = {};
  const report: ImportReport = { imported: [], missing: [], unconvertible: [] };

  const vars = response.meta.variables;
  const collections = response.meta.variableCollections;

  // Build name → variable lookup, optionally restricted to a single collection.
  const byName = new Map<string, FigmaVariable>();
  let activeCollection: FigmaVariableCollection | null = null;
  for (const v of Object.values(vars)) {
    const coll = collections[v.variableCollectionId];
    if (!coll) continue;
    if (mapping.collection) {
      if (coll.name !== mapping.collection) continue;
      activeCollection = coll;
    } else {
      activeCollection ??= coll;
    }
    byName.set(v.name, v);
  }
  if (!activeCollection) {
    throw new Error(
      mapping.collection
        ? `No Figma variable collection named "${mapping.collection}"`
        : "No Figma variable collections in response",
    );
  }

  // Polymorph mode → Figma modeId lookup.
  const modeIdByPolymorphMode = new Map<ThemeMode, string>();
  for (const [polyMode, figmaName] of Object.entries(mapping.modes) as [ThemeMode, string][]) {
    const mode = activeCollection.modes.find((m) => m.name === figmaName);
    if (mode) modeIdByPolymorphMode.set(polyMode, mode.modeId);
  }
  const defaultModeId = activeCollection.defaultModeId;

  // Walk the Polymorph id → Figma name mapping.
  for (const [pmId, figmaName] of Object.entries(mapping.ids) as [SemanticTokenId, string][]) {
    const variable = byName.get(figmaName);
    if (!variable) {
      report.missing.push({ id: pmId, path: figmaName, mode: "invariant" });
      continue;
    }
    const dtcgType = TYPE_OF.get(pmId);
    if (!dtcgType) continue;
    const segs = pmId.replace(/^pm\./, "").split(".");
    const modeSensitive = MODE_SENSITIVE.get(pmId);

    if (modeSensitive) {
      const modesRoot = (pm.modes as Record<string, unknown>) ?? (pm.modes = {} as Record<string, unknown>);
      for (const [polyMode, modeId] of modeIdByPolymorphMode) {
        const raw = variable.valuesByMode[modeId];
        if (raw === undefined) {
          report.missing.push({ id: pmId, path: figmaName, mode: polyMode });
          continue;
        }
        let resolved: FigmaVariableValue;
        try {
          resolved = resolveAlias(raw, modeId, vars, new Set([variable.id]));
        } catch {
          report.unconvertible.push({ id: pmId, from: variable.resolvedType, to: dtcgType, mode: polyMode });
          continue;
        }
        const converted = convertFigmaValue(resolved, dtcgType);
        if (!converted) {
          report.unconvertible.push({ id: pmId, from: variable.resolvedType, to: dtcgType, mode: polyMode });
          continue;
        }
        const modeRoot =
          ((modesRoot as Record<string, unknown>)[polyMode] as Record<string, unknown>) ??
          ((modesRoot as Record<string, unknown>)[polyMode] = {} as Record<string, unknown>);
        setPath(modeRoot, segs, converted);
        report.imported.push(pmId);
      }
    } else {
      const raw = variable.valuesByMode[defaultModeId];
      if (raw === undefined) {
        report.missing.push({ id: pmId, path: figmaName, mode: "invariant" });
        continue;
      }
      let resolved: FigmaVariableValue;
      try {
        resolved = resolveAlias(raw, defaultModeId, vars, new Set([variable.id]));
      } catch {
        report.unconvertible.push({ id: pmId, from: variable.resolvedType, to: dtcgType, mode: "invariant" });
        continue;
      }
      const converted = convertFigmaValue(resolved, dtcgType);
      if (!converted) {
        report.unconvertible.push({ id: pmId, from: variable.resolvedType, to: dtcgType, mode: "invariant" });
        continue;
      }
      setPath(pm, segs, converted);
      report.imported.push(pmId);
    }
  }

  return { theme: { contractVersion: "0.0.0", pm }, report };
}
