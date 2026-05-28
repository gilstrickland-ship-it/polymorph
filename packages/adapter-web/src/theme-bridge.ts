import type { ResolvedTheme, SemanticTokenId } from "@polymorph/spec";
import { toCssVarName } from "./css-vars.js";

/** CSS sub-properties of a typography composite (each is a `var(--…)` reference). */
export interface TypographyStyle {
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
}

/**
 * Web bridge: accessors return CSS `var(--…)` references rather than concrete values, so styles
 * resolve through the ThemeProvider's injected stylesheet (cheap theme switches; no React re-render
 * on swap). For concrete values (e.g. retrofit), use `toTokenMap` from `./retrofit`.
 */
export interface ThemeBridge {
  readonly raw: ResolvedTheme;
  has(id: SemanticTokenId): boolean;
  /** `var(--pm-color-surface-base)`-style reference for a color token. */
  color(id: SemanticTokenId): string;
  /** `var(--pm-radius-control)` for a dimension/size/radius token. */
  dim(id: SemanticTokenId): string;
  /** `var(--pm-opacity-disabled)` for a number token. */
  num(id: SemanticTokenId): string;
  /** Sub-property references for a typography composite, ready to spread into `style`. */
  typography(id: SemanticTokenId): TypographyStyle;
}

const varRef = (id: SemanticTokenId): string => `var(${toCssVarName(id)})`;

export function createBridge(rt: ResolvedTheme): ThemeBridge {
  const tokens = rt.tokens as Record<string, { $type: string; value: unknown } | undefined>;
  const present = (id: SemanticTokenId): void => {
    if (!tokens[id]) throw new Error(`theme is missing token: ${id}`);
  };
  return {
    raw: rt,
    has: (id) => tokens[id] !== undefined,
    color: (id) => {
      present(id);
      return varRef(id);
    },
    dim: (id) => {
      present(id);
      return varRef(id);
    },
    num: (id) => {
      present(id);
      return varRef(id);
    },
    typography: (id) => {
      present(id);
      const base = toCssVarName(id);
      return {
        fontFamily: `var(${base}-font-family)`,
        fontWeight: `var(${base}-font-weight)`,
        fontSize: `var(${base}-font-size)`,
        lineHeight: `var(${base}-line-height)`,
        letterSpacing: `var(${base}-letter-spacing)`,
      };
    },
  };
}
