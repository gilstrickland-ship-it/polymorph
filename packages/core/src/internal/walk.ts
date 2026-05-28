import { ResolveError } from "../errors.js";

export interface TokenNode {
  $type?: string;
  $value: unknown;
  [k: string]: unknown;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Index every token node (an object with a `$value`) by its dotted path. */
export function indexTokens(theme: unknown): Map<string, TokenNode> {
  const map = new Map<string, TokenNode>();
  const walk = (obj: Record<string, unknown>, prefix: string): void => {
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("$")) continue;
      if (!isObject(v)) continue;
      const path = prefix ? `${prefix}.${k}` : k;
      if ("$value" in v) {
        map.set(path, v as TokenNode);
      } else {
        walk(v, path);
      }
    }
  };
  if (isObject(theme)) walk(theme, "");
  return map;
}

export function isAliasString(v: unknown): v is string {
  return typeof v === "string" && /^\{[^{}]+\}$/.test(v);
}

export function aliasInner(v: string): string {
  return v.slice(1, -1);
}

/**
 * Resolve a value, following DTCG aliases (top-level and nested) to concrete values.
 * Throws ResolveError on a dangling reference or a cycle. `visiting` tracks alias target paths
 * on the current chain for cycle detection.
 */
export function resolveValueDeep(
  index: Map<string, TokenNode>,
  value: unknown,
  visiting: Set<string> = new Set(),
): unknown {
  if (isAliasString(value)) {
    const target = aliasInner(value);
    if (visiting.has(target)) {
      throw new ResolveError("ALIAS_CYCLE", `alias cycle: ${[...visiting, target].join(" → ")}`);
    }
    const node = index.get(target);
    if (!node) {
      throw new ResolveError("ALIAS_UNRESOLVED", `alias references unknown token: {${target}}`);
    }
    const next = new Set(visiting);
    next.add(target);
    return resolveValueDeep(index, node.$value, next);
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveValueDeep(index, v, visiting));
  }
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveValueDeep(index, v, visiting);
    return out;
  }
  return value;
}
