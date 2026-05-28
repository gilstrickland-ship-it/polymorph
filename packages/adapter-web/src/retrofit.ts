import type { ResolvedTheme, SemanticTokenId } from "@polymorph/spec";

/**
 * Retrofit shim: a plain `pm.* → concrete value` record an existing web SDK can read into its
 * own theme object / styling layer. Mirrors the React Native adapter's `toTokenMap` so the
 * brownfield path (Constitution Principle I/IV; spec FR-018–020) is identical across adapters.
 *
 * Note: the resolved value shapes are the contract's neutral forms (e.g. dimension `{value, unit}`)
 * — *not* CSS strings. Use `toCssVariables` from `./css-vars` when you need CSS output.
 */
export function toTokenMap(rt: ResolvedTheme): Record<SemanticTokenId, unknown> {
  const out: Record<string, unknown> = {};
  for (const [id, token] of Object.entries(rt.tokens)) {
    if (token) out[id] = (token as { value: unknown }).value;
  }
  return out as Record<SemanticTokenId, unknown>;
}
