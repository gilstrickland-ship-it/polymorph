// Compile-time tests (validated by `pnpm --filter @polymorph/spec typecheck`).
import type { ResolvedTheme, SemanticTokenId } from "../src/index.js";

export const okId: SemanticTokenId = "pm.color.text.body";

// @ts-expect-error — primitive ids are not part of the contract surface (US1)
export const badId: SemanticTokenId = "palette.blue.600";

export function readPrimary(t: ResolvedTheme): unknown {
  return t.tokens["pm.color.action.primary.rest"]?.value;
}

export function readBad(t: ResolvedTheme): unknown {
  // @ts-expect-error — indexing the neutral token map by a non-pm id is a type error
  return t.tokens["palette.blue.600"];
}
