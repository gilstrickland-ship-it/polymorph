import type { SemanticTokenId, TokenType, ComponentRole } from "./generated/contract-ids.js";

export type { SemanticTokenId, TokenType, ComponentRole };

export type ThemeMode = "light" | "dark" | "highContrast";

/** A semantic token's resolved value, per its DTCG `$type`. */
export interface ResolvedToken {
  $type: TokenType;
  value: unknown;
}

/**
 * The neutral output SDKs/adapters consume (Constitution Principle IV). A plain data record:
 * no framework, styling-library, or component-model coupling. Keys are `pm.*` ids only — never
 * FI primitives — and contain no aliases (all resolved).
 */
export interface ResolvedTheme {
  contractVersion: string;
  mode: ThemeMode;
  tokens: Partial<Record<SemanticTokenId, ResolvedToken>>;
  components: Partial<Record<ComponentRole, Record<string, unknown>>>;
}

/** A DTCG token node as authored in a theme file. */
export interface ThemeToken {
  $type: TokenType;
  $value: unknown;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

/** Loosely-typed view of an authored theme file (validated structurally by the JSON Schema). */
export interface ThemeFile {
  $schema?: string;
  contractVersion?: string;
  pm: Record<string, unknown>;
  [primitiveGroup: string]: unknown;
}
