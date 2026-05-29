import { useCallback, useMemo, useReducer } from "react";
import { validateTheme, resolveTheme, lintTheme, type LintWarning, type ValidationError } from "@polymorph/core";
import { COMPONENT_ROLES, type SemanticTokenId, type ThemeMode } from "@polymorph/spec";

// Component-role top-level segments (e.g. "button", "input", "card", "disclosure"). Used
// by `diffPaths` to split `pm.<x>.…` paths into token-id vs. component-override sets.
const COMPONENT_ROLE_TOPS = new Set(COMPONENT_ROLES.map((r) => r.role.split(".")[0]!));

/**
 * Snapshot of the editor's state. The `working` theme is what the editor mutates; `baseline`
 * is the theme as initially loaded — `dirty` and `changedTokenIds` derive from comparing the
 * two by structural value at each `pm.*` path. Validation + lint warnings are recomputed on
 * every successful edit (cheap relative to the work the user does between edits).
 */
export interface ThemeEditorState {
  baseline: unknown;
  working: unknown;
  mode: ThemeMode;
  dirty: boolean;
  /** Set of `pm.*` token ids whose authored value differs from baseline. */
  changedTokenIds: ReadonlySet<SemanticTokenId>;
  /**
   * Set of `${role}.${property}` paths whose component override differs from baseline
   * (e.g. `"button.primary.background"`). Distinct from `changedTokenIds` because
   * component-property paths aren't `SemanticTokenId`s — they're free-form overrides per
   * the contract's role/property schema.
   */
  changedComponentPaths: ReadonlySet<string>;
  validation: { valid: boolean; errors: ValidationError[] };
  /** Lint warnings against the resolved theme at the current mode. */
  warnings: LintWarning[];
}

export interface ThemeEditorActions {
  /** Replace the authored value at `pm.<id>` (mode-sensitive ids are written under `pm.modes.<mode>.<id>`). */
  setTokenValue(id: SemanticTokenId, $type: string, value: unknown): void;
  /** Set a single component-role property override. */
  setComponentProperty(role: string, property: string, value: unknown): void;
  /** Switch the mode the editor is previewing / linting. */
  setMode(mode: ThemeMode): void;
  /** Revert every edit. */
  reset(): void;
  /** Snapshot the working theme as the new baseline (so further edits diff against it). */
  commit(): void;
  /** Replace both baseline + working with an externally-provided theme. */
  loadTheme(theme: unknown): void;
}

export interface ThemeEditorHook extends ThemeEditorActions {
  state: ThemeEditorState;
  /** Convenience: the working theme as a plain JS object, ready to download / submit. */
  exportTheme(): unknown;
}

// --- internals ---------------------------------------------------------------

type Action =
  | { type: "setTokenValue"; id: SemanticTokenId; $type: string; value: unknown }
  | { type: "setComponentProperty"; role: string; property: string; value: unknown }
  | { type: "setMode"; mode: ThemeMode }
  | { type: "reset" }
  | { type: "commit" }
  | { type: "loadTheme"; theme: unknown };

interface Internal {
  baseline: unknown;
  working: unknown;
  mode: ThemeMode;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
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

function getPath(root: unknown, segs: string[]): unknown {
  let cur = root;
  for (const seg of segs) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Where does a token's authored value live in the theme JSON? Mode-invariant ids live at
 * `pm.<segments>`. Mode-sensitive ids live at `pm.modes.<mode>.<segments>`. We don't have a
 * cheap way to query `modeSensitive` here without importing TOKENS — but writing under both
 * locations on every set is wasteful. Instead, the caller passes `$type` and we look up
 * where the SAME id lives in the baseline; absent that, we infer from whether a node already
 * exists at the mode path.
 */
function writeTokenValue(
  draft: Record<string, unknown>,
  baseline: unknown,
  id: SemanticTokenId,
  $type: string,
  value: unknown,
  mode: ThemeMode,
): void {
  const tail = id.replace(/^pm\./, "").split(".");
  // Probe baseline for the same id under the mode path; if present there, write under mode.
  const modePath = ["pm", "modes", mode, ...tail];
  const invariantPath = ["pm", ...tail];
  const inMode = getPath(baseline, modePath) !== undefined;
  const segs = inMode ? modePath : invariantPath;
  setPath(draft, segs, { $type, $value: value });
}

function readTokenValue(theme: unknown, id: SemanticTokenId, mode: ThemeMode): unknown {
  const tail = id.replace(/^pm\./, "").split(".");
  const mode_v = getPath(theme, ["pm", "modes", mode, ...tail]);
  if (mode_v !== undefined) return mode_v;
  return getPath(theme, ["pm", ...tail]);
}

function reducer(s: Internal, a: Action): Internal {
  switch (a.type) {
    case "setTokenValue": {
      const next = clone(s.working) as Record<string, unknown>;
      writeTokenValue(next, s.baseline, a.id, a.$type, a.value, s.mode);
      return { ...s, working: next };
    }
    case "setComponentProperty": {
      // Component overrides authored under `pm.<role>.<property>` per the contract schema —
      // matches `resolveTheme`'s lookup (`index.get('pm.' + role + '.' + property)`). A
      // role can be dotted (`button.primary`); split it into segments so the path nests
      // correctly.
      const next = clone(s.working) as Record<string, unknown>;
      const roleSegs = a.role.split(".");
      setPath(next, ["pm", ...roleSegs, a.property], a.value);
      return { ...s, working: next };
    }
    case "setMode":
      return { ...s, mode: a.mode };
    case "reset":
      return { ...s, working: clone(s.baseline) };
    case "commit":
      return { ...s, baseline: clone(s.working) };
    case "loadTheme":
      return { ...s, baseline: clone(a.theme), working: clone(a.theme) };
  }
}

/**
 * Compare baseline and working at every `pm.*` path the contract knows about. Diff is by
 * structural equality of authored value, not resolved value. Mode-sensitive ids are diffed
 * once per declared mode and the union is returned. Splits the changed paths into the
 * `tokens` set (token ids) and `componentPaths` set (`role.property` strings), driven by
 * whether the path's leading segment matches a declared component-role top.
 */
function diffPaths(
  baseline: unknown,
  working: unknown,
  modes: ThemeMode[],
): { tokens: Set<SemanticTokenId>; componentPaths: Set<string> } {
  const tokens = new Set<SemanticTokenId>();
  const componentPaths = new Set<string>();
  walk(working, [], (path, node) => {
    if (!isAuthoredToken(node)) return;
    const baselineAt = getPath(baseline, path);
    if (deepEqual(baselineAt, node)) return;
    if (path[0] !== "pm" || path.length < 2) return;
    // Component-override path: `pm.<role-top>...`. The role can be dotted (`button.primary`),
    // so the property is everything after the role segments. The schema gives roles a
    // closed set of tops; anything past the role is the property name.
    if (COMPONENT_ROLE_TOPS.has(path[1]!)) {
      const compPath = path.slice(1).join(".");
      componentPaths.add(compPath);
      return;
    }
    const id = pathToId(path, modes);
    if (id) tokens.add(id as SemanticTokenId);
  });
  return { tokens, componentPaths };
}

function walk(
  node: unknown,
  path: string[],
  visit: (path: string[], node: unknown) => void,
): void {
  if (node === null || typeof node !== "object" || Array.isArray(node)) return;
  visit(path, node);
  for (const [k, v] of Object.entries(node)) walk(v, [...path, k], visit);
}

function isAuthoredToken(n: unknown): boolean {
  return !!n && typeof n === "object" && "$type" in (n as object) && "$value" in (n as object);
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

/** `["pm", "modes", "light", "color", "surface", "base"]` → `pm.color.surface.base`. */
function pathToId(path: string[], modes: ThemeMode[]): string | null {
  if (path[0] !== "pm" || path.length < 2) return null;
  if (path[1] === "modes" && path.length >= 3 && modes.includes(path[2] as ThemeMode)) {
    return ["pm", ...path.slice(3)].join(".");
  }
  if (path[1] === "modes" || path[1] === "components") return null;
  return path.join(".");
}

// --- public hook -------------------------------------------------------------

/**
 * Headless theme editor. Returns the current state, action callbacks, and a `state.warnings`
 * array recomputed on every render so the host can surface lint inline. The hook is
 * deliberately framework-light (one `useReducer`, no context, no portals) so it composes
 * with whatever existing form-state machinery the FI already has.
 */
export function useThemeEditor(initial: unknown, initialMode: ThemeMode = "light"): ThemeEditorHook {
  const [internal, dispatch] = useReducer(reducer, undefined, () => ({
    baseline: clone(initial),
    working: clone(initial),
    mode: initialMode,
  }));

  const state = useMemo<ThemeEditorState>(() => {
    const validation = validateTheme(internal.working);
    let warnings: LintWarning[] = [];
    if (validation.valid) {
      try {
        warnings = lintTheme(resolveTheme(internal.working, internal.mode));
      } catch {
        warnings = [];
      }
    }
    const modes = ["light", "dark", "highContrast"] as ThemeMode[];
    const { tokens: changedTokenIds, componentPaths: changedComponentPaths } = diffPaths(
      internal.baseline,
      internal.working,
      modes,
    );
    return {
      baseline: internal.baseline,
      working: internal.working,
      mode: internal.mode,
      dirty: changedTokenIds.size > 0 || changedComponentPaths.size > 0,
      changedTokenIds,
      changedComponentPaths,
      validation,
      warnings,
    };
  }, [internal.baseline, internal.working, internal.mode]);

  const setTokenValue = useCallback(
    (id: SemanticTokenId, $type: string, value: unknown) =>
      dispatch({ type: "setTokenValue", id, $type, value }),
    [],
  );
  const setComponentProperty = useCallback(
    (role: string, property: string, value: unknown) =>
      dispatch({ type: "setComponentProperty", role, property, value }),
    [],
  );
  const setMode = useCallback((mode: ThemeMode) => dispatch({ type: "setMode", mode }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);
  const commit = useCallback(() => dispatch({ type: "commit" }), []);
  const loadTheme = useCallback((theme: unknown) => dispatch({ type: "loadTheme", theme }), []);
  const exportTheme = useCallback(() => clone(internal.working), [internal.working]);

  return {
    state,
    setTokenValue,
    setComponentProperty,
    setMode,
    reset,
    commit,
    loadTheme,
    exportTheme,
  };
}

/** Convenience helper for callers who want to read a token's CURRENT authored value. */
export function readAuthoredValue(theme: unknown, id: SemanticTokenId, mode: ThemeMode): unknown {
  const node = readTokenValue(theme, id, mode);
  if (!isAuthoredToken(node)) return undefined;
  return (node as { $value: unknown }).$value;
}
