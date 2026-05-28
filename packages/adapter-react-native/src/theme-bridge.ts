import type { ResolvedTheme, SemanticTokenId } from "@polymorph/spec";

export interface TypographyStyle {
  fontFamily?: string;
  fontWeight?: string | number;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

/** Ergonomic, RN-friendly accessors over a ResolvedTheme. Pure; no react / react-native. */
export interface ThemeBridge {
  readonly raw: ResolvedTheme;
  has(id: SemanticTokenId): boolean;
  /** A color token's value (CSS color string). Throws if absent. */
  color(id: SemanticTokenId): string;
  /** A dimension/size/radius token as a number (RN density-independent px). Throws if absent. */
  dim(id: SemanticTokenId): number;
  /** A number token (e.g. opacity). Throws if absent. */
  num(id: SemanticTokenId): number;
  /** A typography composite as an RN TextStyle-shaped object. Throws if absent. */
  typography(id: SemanticTokenId): TypographyStyle;
}

function get(rt: ResolvedTheme, id: SemanticTokenId): unknown {
  const t = (rt.tokens as Record<string, { value: unknown } | undefined>)[id];
  if (!t) throw new Error(`theme is missing token: ${id}`);
  return t.value;
}

function toNumber(v: unknown, id: string): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "value" in v && typeof (v as { value: unknown }).value === "number") {
    return (v as { value: number }).value;
  }
  throw new Error(`token ${id} is not a numeric/dimension value`);
}

export function createBridge(rt: ResolvedTheme): ThemeBridge {
  const tokens = rt.tokens as Record<string, { value: unknown } | undefined>;
  return {
    raw: rt,
    has: (id) => tokens[id] !== undefined,
    color: (id) => {
      const v = get(rt, id);
      if (typeof v !== "string") throw new Error(`token ${id} is not a color string`);
      return v;
    },
    dim: (id) => toNumber(get(rt, id), id),
    num: (id) => {
      const v = get(rt, id);
      if (typeof v !== "number") throw new Error(`token ${id} is not a number`);
      return v;
    },
    typography: (id) => {
      const v = get(rt, id);
      if (!v || typeof v !== "object") throw new Error(`token ${id} is not a typography composite`);
      const o = v as Record<string, unknown>;
      const fontSize = o.fontSize;
      const letterSpacing = o.letterSpacing;
      return {
        fontFamily: typeof o.fontFamily === "string" ? o.fontFamily : undefined,
        fontWeight: (typeof o.fontWeight === "string" || typeof o.fontWeight === "number") ? o.fontWeight : undefined,
        fontSize: fontSize !== undefined ? toNumber(fontSize, `${id}.fontSize`) : undefined,
        lineHeight: typeof o.lineHeight === "number" ? o.lineHeight : undefined,
        letterSpacing: letterSpacing !== undefined ? toNumber(letterSpacing, `${id}.letterSpacing`) : undefined,
      };
    },
  };
}
