# Contract: `@polymorph/authoring` API

```ts
import type { SemanticTokenId, ThemeMode } from "@polymorph/spec";

// --- inputs ------------------------------------------------------------------
export interface TokensStudioToken { value: unknown; type: string; description?: string; $extensions?: Record<string, unknown> }
export type TokensStudioSet = { [name: string]: TokensStudioSet | TokensStudioToken }
export interface TokensStudioExport {
  [setName: string]: TokensStudioSet | unknown;
  $themes?: TokensStudioTheme[];
  $metadata?: { tokenSetOrder?: string[]; activeThemeGroup?: string };
}
export interface TokensStudioTheme { name: string; selectedTokenSets: Record<string, "enabled" | "source" | "disabled">; $figmaCollectionId?: string }

export interface ModeMapping {
  sets: string[];                                              // merge in order; later overrides earlier
  ids: Partial<Record<SemanticTokenId, string>>;              // Polymorph id → Tokens Studio dotted path
}
export interface MappingConfig {
  invariant: ModeMapping;
  modes: Partial<Record<ThemeMode, ModeMapping>>;
}

// --- importer ----------------------------------------------------------------
export interface ImportReport {
  imported: SemanticTokenId[];                                                // event log (mode-sensitive ids counted per mode)
  missing: { id: SemanticTokenId; path: string; mode: ThemeMode | "invariant" }[];
  unconvertible: { id: SemanticTokenId; from: string; to: string; mode: ThemeMode | "invariant" }[];
}
export interface ImportResult { theme: { contractVersion: string; pm: Record<string, unknown> }; report: ImportReport }

export function importTokensStudio(input: TokensStudioExport, mapping: MappingConfig): ImportResult;
export function lintMapping(mapping: MappingConfig): string[];

// --- per-type converters (also exported for reuse) --------------------------
export function resolveValue(value: unknown, registry: ReadonlyMap<string, TokensStudioToken>): unknown;
export function convertToDtcg(token: TokensStudioToken, targetType: string, registry: ReadonlyMap<string, TokensStudioToken>): { $type: string; $value: unknown; $description?: string } | null;
export function parseDimension(v: unknown): { value: number; unit: "px" | "rem" } | null;
export function normalizeFontWeight(v: unknown): number | string | null;
export function normalizeLineHeight(v: unknown): number | null;
export function normalizeOpacity(v: unknown): number | null;
```

## Behaviors

- `importTokensStudio` does **not** validate — feed its `theme` to `@polymorph/core.validateTheme`.
- The report lists imports as events (mode-sensitive ids appear once per declared mode), missing
  ids (path not found in the merged registry), and unconvertible ids (value couldn't be coerced).
- Aliases inside Tokens Studio values are resolved during conversion; the emitted theme has no
  `{…}` references.
- Type mapping (Tokens Studio → DTCG): `color` → `color`; `spacing` / `sizing` / `borderRadius` /
  `borderWidth` / `dimension` → `dimension`; `typography` composite (with `"Regular"`, `"150%"`,
  `"AUTO"`, etc.) → `typography`; `boxShadow` → `shadow`; `opacity` → `number`; `duration` and
  `cubicBezier` pass through.
- Unknown / unsupported source types → `null` from `convertToDtcg`; surfaced in
  `report.unconvertible` (not thrown).
