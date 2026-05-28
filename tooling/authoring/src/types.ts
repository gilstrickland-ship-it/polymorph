import type { SemanticTokenId, ThemeMode } from "@polymorph/spec";

// --- Tokens Studio export shape ----------------------------------------------

/**
 * One Tokens Studio token. Tokens Studio predates the W3C DTCG spec and uses unprefixed
 * `value`/`type` keys (rather than DTCG's `$value`/`$type`).
 */
export interface TokensStudioToken {
  value: unknown;
  type: string;
  description?: string;
  /** Tokens Studio also writes `$extensions` on tokens authored from Figma. Pass through. */
  $extensions?: Record<string, unknown>;
}

/** A nested group of tokens (Tokens Studio sets are arbitrarily-deep groups). */
export type TokensStudioSet = { [name: string]: TokensStudioSet | TokensStudioToken };

/** A consolidated Tokens Studio export (the single-file JSON format). */
export interface TokensStudioExport {
  /** Token sets at root, keyed by set name. `$themes` and `$metadata` are special. */
  [setName: string]: TokensStudioSet | unknown;
  $themes?: TokensStudioTheme[];
  $metadata?: { tokenSetOrder?: string[]; activeThemeGroup?: string };
}

export interface TokensStudioTheme {
  name: string;
  /** Per Tokens Studio: `"enabled"` adds the set; `"source"` makes it base; `"disabled"` excludes. */
  selectedTokenSets: Record<string, "enabled" | "source" | "disabled">;
  $figmaCollectionId?: string;
}

// --- Mapping (FI-supplied) ---------------------------------------------------

/** Which Tokens Studio sets, in override order (later wins), supply a given Polymorph mapping. */
export interface ModeMapping {
  /** Tokens Studio set names to merge, in order. Later sets override earlier (matching TS semantics). */
  sets: string[];
  /** Map of Polymorph semantic id → Tokens Studio dotted path within the merged set. */
  ids: Partial<Record<SemanticTokenId, string>>;
}

/**
 * FI-supplied mapping config: where to find each Polymorph semantic token within a Tokens Studio
 * export. Mode-invariant ids come from `invariant`; mode-sensitive ids come from each declared mode.
 */
export interface MappingConfig {
  invariant: ModeMapping;
  modes: Partial<Record<ThemeMode, ModeMapping>>;
}
