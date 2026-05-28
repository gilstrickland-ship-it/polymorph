import type { ResolvedTheme, SemanticTokenId } from "@polymorph/spec";

/**
 * Retrofit shim target: flatten a ResolvedTheme into a plain `id → value` map an existing SDK
 * can read into its own theme object/style API without adopting Polymorph's components
 * (Constitution Principle I/IV; spec FR-018–020). Keys are pm.* only; no aliases.
 */
export function toTokenMap(rt: ResolvedTheme): Record<SemanticTokenId, unknown> {
  const out: Record<string, unknown> = {};
  for (const [id, token] of Object.entries(rt.tokens)) {
    if (token) out[id] = (token as { value: unknown }).value;
  }
  return out as Record<SemanticTokenId, unknown>;
}
