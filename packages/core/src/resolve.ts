import {
  TOKENS,
  COMPONENT_ROLES,
  MODE_SENSITIVE_TOKEN_IDS,
  CONTRACT_VERSION,
  type ResolvedTheme,
  type ThemeMode,
  type SemanticTokenId,
  type ComponentRole,
} from "@polymorph/spec";
import { ResolveError } from "./errors.js";
import { indexTokens, resolveValueDeep, type TokenNode } from "./internal/walk.js";

const MODE_SENSITIVE = new Set<string>(MODE_SENSITIVE_TOKEN_IDS);
const SUPPORTED: ThemeMode[] = ["light", "dark", "highContrast"];

/** The theme path for a semantic id under a given mode. */
function pathForId(id: string, mode: ThemeMode): string {
  return MODE_SENSITIVE.has(id) ? id.replace(/^pm\./, `pm.modes.${mode}.`) : id;
}

/** Modes a theme declares under pm.modes.* (intersected with supported modes). */
export function declaredModes(theme: unknown): ThemeMode[] {
  const modes = (theme as { pm?: { modes?: Record<string, unknown> } })?.pm?.modes ?? {};
  return SUPPORTED.filter((m) => m in modes);
}

/**
 * Resolve a *validated* theme for a mode (default "light") into the neutral ResolvedTheme:
 * aliases resolved, mode selected, mode-invariant tokens included, component overrides resolved
 * with defaultsFrom fallback. Keys are pm.* only; no aliases remain.
 */
export function resolveTheme(theme: unknown, mode: ThemeMode = "light"): ResolvedTheme {
  if (!declaredModes(theme).includes(mode)) {
    throw new ResolveError("MODE_NOT_DECLARED", `theme does not declare mode '${mode}'`);
  }
  const index = indexTokens(theme);

  const resolveNode = (node: TokenNode): unknown => resolveValueDeep(index, node.$value);

  const tokens: Partial<Record<SemanticTokenId, { $type: string; value: unknown }>> = {};
  for (const t of TOKENS) {
    const node = index.get(pathForId(t.id, mode));
    if (!node) continue; // absent optional token
    tokens[t.id] = { $type: t.type, value: resolveNode(node) };
  }

  const components: Partial<Record<ComponentRole, Record<string, unknown>>> = {};
  for (const role of COMPONENT_ROLES) {
    const props: Record<string, unknown> = {};
    for (const p of role.properties) {
      const overrideNode = index.get(`pm.${role.role}.${p.property}`);
      let value: unknown;
      if (overrideNode) {
        value = resolveNode(overrideNode);
      } else {
        const defNode = index.get(pathForId(p.defaultsFrom, mode));
        value = defNode ? resolveNode(defNode) : undefined;
      }
      if (value !== undefined) props[p.property] = value;
    }
    if (Object.keys(props).length > 0) components[role.role] = props;
  }

  const contractVersion =
    (theme as { contractVersion?: string }).contractVersion ?? CONTRACT_VERSION;

  return { contractVersion, mode, tokens, components } as ResolvedTheme;
}
