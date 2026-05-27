import {
  TOKENS,
  COMPONENT_ROLES,
  ALL_TOKEN_IDS,
  REQUIRED_TOKEN_IDS,
  MODE_SENSITIVE_TOKEN_IDS,
  type ManifestTokenEntry,
  type ComponentRoleEntry,
  type SemanticTokenId,
  type TokenType,
  type ComponentRole,
} from "./generated/contract-ids.js";

const BY_ID: ReadonlyMap<string, ManifestTokenEntry> = new Map(TOKENS.map((t) => [t.id, t]));
const ID_SET: ReadonlySet<string> = new Set(ALL_TOKEN_IDS);
const ROLE_SET: ReadonlySet<string> = new Set(COMPONENT_ROLES.map((r) => r.role));

export function allTokens(): readonly ManifestTokenEntry[] {
  return TOKENS;
}

export function requiredTokenIds(): readonly SemanticTokenId[] {
  return REQUIRED_TOKEN_IDS;
}

export function modeSensitiveTokenIds(): readonly SemanticTokenId[] {
  return MODE_SENSITIVE_TOKEN_IDS;
}

export function componentRoles(): readonly ComponentRoleEntry[] {
  return COMPONENT_ROLES;
}

export function isSemanticTokenId(value: unknown): value is SemanticTokenId {
  return typeof value === "string" && ID_SET.has(value);
}

export function isComponentRole(value: unknown): value is ComponentRole {
  return typeof value === "string" && ROLE_SET.has(value);
}

/** The expected DTCG `$type` for a semantic token id, or `undefined` if not a known id. */
export function typeOf(id: string): TokenType | undefined {
  return BY_ID.get(id)?.type;
}

export function isRequired(id: string): boolean {
  return BY_ID.get(id)?.required ?? false;
}
