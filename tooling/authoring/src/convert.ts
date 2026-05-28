import type { TokensStudioToken } from "./types.js";

// --- alias resolution --------------------------------------------------------

const ALIAS_RE = /^\{([^{}]+)\}$/;
const isAliasString = (v: unknown): v is string => typeof v === "string" && ALIAS_RE.test(v);
const aliasInner = (v: string): string => v.match(ALIAS_RE)![1]!;

/**
 * Resolve `{path.to.token}` references in `value`, following aliases through `registry` until a
 * concrete value is reached. Throws on a dangling alias or a cycle.
 */
export function resolveValue(
  value: unknown,
  registry: ReadonlyMap<string, TokensStudioToken>,
  visiting: Set<string> = new Set(),
): unknown {
  if (isAliasString(value)) {
    const target = aliasInner(value);
    if (visiting.has(target)) throw new Error(`alias cycle: ${[...visiting, target].join(" → ")}`);
    const node = registry.get(target);
    if (!node) throw new Error(`alias references unknown token: {${target}}`);
    return resolveValue(node.value, registry, new Set(visiting).add(target));
  }
  if (Array.isArray(value)) return value.map((v) => resolveValue(v, registry, visiting));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveValue(v, registry, visiting);
    return out;
  }
  return value;
}

// --- type-by-type conversion to DTCG ----------------------------------------

const TS_DIMENSION_TYPES = new Set([
  "spacing",
  "sizing",
  "borderRadius",
  "borderWidth",
  "fontSizes",
  "fontSize",
  "lineHeights",
  "letterSpacing",
  "letterSpacings",
  "dimension",
  "size",
]);

const FONT_WEIGHT_MAP: Record<string, number> = {
  thin: 100,
  hairline: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  regular: 400,
  normal: 400,
  book: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  black: 900,
  heavy: 900,
};

/** "16px" / "16" / 16 / "1rem" → `{ value, unit }`. Defaults to px. */
export function parseDimension(v: unknown): { value: number; unit: "px" | "rem" } | null {
  if (typeof v === "number" && Number.isFinite(v)) return { value: v, unit: "px" };
  if (typeof v !== "string") return null;
  const s = v.trim();
  const m = s.match(/^(-?\d*\.?\d+)(px|rem)?$/);
  if (!m) return null;
  return { value: parseFloat(m[1]!), unit: (m[2] as "px" | "rem" | undefined) ?? "px" };
}

/** Map a Tokens Studio fontWeight (string or number) to a numeric DTCG weight. */
export function normalizeFontWeight(v: unknown): number | string | null {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return null;
  const key = v.replace(/[\s_-]+/g, "").toLowerCase();
  if (key in FONT_WEIGHT_MAP) return FONT_WEIGHT_MAP[key]!;
  const asNum = Number(v);
  return Number.isFinite(asNum) ? asNum : v; // pass through if it's a custom string
}

/** lineHeight: number passthrough; "150%" → 1.5; "AUTO" → 1.2; numeric strings → number. */
export function normalizeLineHeight(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s.toUpperCase() === "AUTO") return 1.2;
  if (s.endsWith("%")) {
    const n = parseFloat(s.slice(0, -1));
    return Number.isFinite(n) ? n / 100 : null;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Tokens Studio opacity: "50%" or 0.5 or "0.5" → number 0..1. */
export function normalizeOpacity(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s.endsWith("%")) {
    const n = parseFloat(s.slice(0, -1));
    return Number.isFinite(n) ? n / 100 : null;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

interface DtcgToken {
  $type: string;
  $value: unknown;
  $description?: string;
}

/**
 * Convert a (resolved) Tokens Studio token into a DTCG token of the requested target type.
 * Returns `null` if the value can't be coerced (caller decides whether to skip or throw).
 */
export function convertToDtcg(
  token: TokensStudioToken,
  targetType: string,
  registry: ReadonlyMap<string, TokensStudioToken>,
): DtcgToken | null {
  const resolved = resolveValue(token.value, registry);
  const base = (v: unknown): DtcgToken => ({
    $type: targetType,
    $value: v,
    ...(token.description ? { $description: token.description } : {}),
  });

  switch (targetType) {
    case "color": {
      if (typeof resolved !== "string") return null;
      return base(resolved);
    }
    case "dimension": {
      const d = parseDimension(resolved);
      return d ? base(d) : null;
    }
    case "duration": {
      if (typeof resolved === "number") return base({ value: resolved, unit: "ms" });
      if (typeof resolved === "string") {
        const m = resolved.trim().match(/^(-?\d*\.?\d+)(ms|s)?$/);
        if (!m) return null;
        return base({ value: parseFloat(m[1]!), unit: (m[2] as "ms" | "s" | undefined) ?? "ms" });
      }
      return null;
    }
    case "number": {
      const n = normalizeOpacity(resolved);
      return n === null ? null : base(n);
    }
    case "cubicBezier": {
      if (Array.isArray(resolved) && resolved.length === 4 && resolved.every((x) => typeof x === "number")) {
        return base(resolved);
      }
      return null;
    }
    case "typography": {
      if (!resolved || typeof resolved !== "object") return null;
      const o = resolved as Record<string, unknown>;
      const fontFamily = typeof o.fontFamily === "string" ? o.fontFamily : null;
      const fontWeight = normalizeFontWeight(o.fontWeight);
      const fontSize = parseDimension(o.fontSize);
      const lineHeight = normalizeLineHeight(o.lineHeight);
      // Tokens Studio sometimes uses "0%" for letterSpacing; treat % as 0px equivalent (no em mapping).
      const lsRaw = o.letterSpacing;
      const letterSpacing =
        typeof lsRaw === "string" && lsRaw.trim().endsWith("%")
          ? { value: 0, unit: "px" as const }
          : parseDimension(lsRaw);
      if (fontFamily === null || fontWeight === null || fontSize === null || lineHeight === null || letterSpacing === null) {
        return null;
      }
      return base({ fontFamily, fontWeight, fontSize, lineHeight, letterSpacing });
    }
    case "shadow": {
      // Tokens Studio shadow can be a single object or an array.
      const items = Array.isArray(resolved) ? resolved : [resolved];
      const shadows = items
        .map((it) => {
          if (!it || typeof it !== "object") return null;
          const s = it as Record<string, unknown>;
          const color = typeof s.color === "string" ? s.color : null;
          const x = parseDimension(s.x);
          const y = parseDimension(s.y);
          const blur = parseDimension(s.blur);
          const spread = parseDimension(s.spread);
          if (!color || !x || !y || !blur || !spread) return null;
          const inset = s.type === "innerShadow" ? { inset: true } : {};
          return { color, offsetX: x, offsetY: y, blur, spread, ...inset };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);
      if (shadows.length === 0) return null;
      return base(shadows.length === 1 ? shadows[0] : shadows);
    }
    default:
      return null;
  }
}
