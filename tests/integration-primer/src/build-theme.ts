// Build a Polymorph theme from `@primer/primitives`'s published CSS exports.
//
// This is the FI's adoption work, expressed once: map their semantic vocabulary to ours.
// No custom adapter — the existing contract + validator + lint consume the result.
//
// Where Primer has a direct equivalent we use it. Where they don't (typography composites,
// motion durations beyond `--duration`), we synthesise sensible Primer-aligned defaults
// drawn from their published documentation. Each fallback is annotated.

import type { ThemeMode } from "@polymorph/spec";
import { loadPrimerBase, loadPrimerTheme } from "./primer-loader.js";

/**
 * Primer-CSS-var → Polymorph-pm.id mapping for colour tokens. Hand-written, not
 * generated — reflects design judgement about which Primer slot best satisfies each
 * Polymorph contract slot. Names match Primer 11.x; if Primer renames a semantic in a
 * future major, this mapping is the only thing that changes.
 */
const COLOR_MAPPING: Array<[string, string]> = [
  // Surface family.
  ["bgColor-default", "pm.color.surface.base"],
  ["bgColor-muted", "pm.color.surface.raised"],
  ["bgColor-inset", "pm.color.surface.sunken"],
  ["overlay-bgColor", "pm.color.surface.overlay"],
  ["bgColor-emphasis", "pm.color.surface.inverse"],
  // Text family.
  ["fgColor-default", "pm.color.text.body"],
  ["fgColor-muted", "pm.color.text.muted"],
  ["fgColor-disabled", "pm.color.text.disabled"],
  ["fgColor-link", "pm.color.text.link"],
  ["fgColor-onEmphasis", "pm.color.text.onInverse"],
  ["fgColor-white", "pm.color.text.onAction"],
  // Action — primary uses Primer's "default" button colours.
  ["button-primary-bgColor-rest", "pm.color.action.primary.rest"],
  ["button-primary-bgColor-hover", "pm.color.action.primary.hover"],
  ["button-primary-bgColor-active", "pm.color.action.primary.pressed"],
  ["button-primary-bgColor-disabled", "pm.color.action.primary.disabled"],
  // Action — secondary uses Primer's outline button surface.
  ["button-default-bgColor-rest", "pm.color.action.secondary.rest"],
  ["button-default-bgColor-active", "pm.color.action.secondary.pressed"],
  // Action — danger uses Primer's danger button.
  ["button-danger-bgColor-hover", "pm.color.action.danger.rest"],
  ["button-danger-bgColor-active", "pm.color.action.danger.pressed"],
  // Feedback accents on surface.base.
  ["fgColor-success", "pm.color.feedback.success"],
  ["fgColor-attention", "pm.color.feedback.warning"],
  ["fgColor-danger", "pm.color.feedback.error"],
  ["fgColor-accent", "pm.color.feedback.info"],
  // Borders.
  ["borderColor-default", "pm.color.border.default"],
  ["borderColor-muted", "pm.color.border.subtle"],
  ["borderColor-emphasis", "pm.color.border.strong"],
  ["focus-outlineColor", "pm.color.border.focus"],
];

/**
 * Required tokens not directly mapped from Primer because they don't have a 1:1
 * equivalent. We supply tasteful Primer-aligned defaults; an FI shipping this in
 * production would author these explicitly.
 */
const COLOR_DEFAULTS_LIGHT: Record<string, string> = {
  "pm.color.text.subtle": "#59636e", // Primer's --fgColor-muted-ish, narrower scope
  "pm.color.action.secondary.rest": "#f6f8fa", // Primer canvas inset
};
const COLOR_DEFAULTS_DARK: Record<string, string> = {
  "pm.color.text.subtle": "#9198a1",
  "pm.color.action.secondary.rest": "#212830",
};

/**
 * Map Primer's spacing/size primitives onto Polymorph's `pm.space.*` and `pm.radius.*`
 * scales. Primer uses a `--base-size-<N>` ladder (4 / 8 / 12 / 16 / 24 / 32 / 40 / 48) +
 * a `--borderRadius-<size>` ladder — clean 1:1 mappings.
 */
const SPACE_MAPPING: Array<[string, string]> = [
  ["space-xs", "pm.space.xs"],
  ["space-sm", "pm.space.sm"],
  ["space-md", "pm.space.md"],
  ["space-lg", "pm.space.lg"],
  ["space-xl", "pm.space.xl"],
];

const RADIUS_MAPPING: Array<[string, string]> = [
  ["borderRadius-small", "pm.radius.control"],
  ["borderRadius-medium", "pm.radius.card"],
  ["borderRadius-full", "pm.radius.full"],
];

/**
 * Resolve `var(--name)` chains through Primer's themed map until we hit a literal. Primer
 * cascades semantic names internally (`--button-primary-bgColor-rest` may alias another
 * Primer semantic); the FI mapping is opaque to the chain length so we follow it here.
 */
function resolveVar(raw: string, themeVars: Record<string, string>, depth = 0): string {
  const v = raw.trim();
  if (depth > 20) throw new Error(`Primer var chain too deep starting from '${raw}'`);
  const refMatch = v.match(/^var\(--([a-zA-Z0-9_-]+)(?:,\s*([^)]+))?\)$/);
  if (!refMatch) return v;
  const name = refMatch[1]!;
  const fallback = refMatch[2]?.trim();
  const next = themeVars[name] ?? fallback;
  if (!next) throw new Error(`Primer var --${name} is undefined and has no fallback`);
  return resolveVar(next, themeVars, depth + 1);
}

/** Pretty-print a `#rrggbb` from any value Primer's CSS might emit. Drops alpha. */
function normalizeHex(raw: string, themeVars: Record<string, string> = {}): string {
  const resolved = resolveVar(raw, themeVars);
  const v = resolved.trim();
  const m = v.match(/^#[0-9a-fA-F]{3,8}$/);
  if (!m) throw new Error(`unexpected colour value '${raw}' (resolved to '${resolved}') from Primer CSS`);
  if (v.length === 4) {
    return `#${v[1]!.repeat(2)}${v[2]!.repeat(2)}${v[3]!.repeat(2)}`.toLowerCase();
  }
  return v.slice(0, 7).toLowerCase();
}

/** Parse `8px` / `0.5rem` → `{ value, unit }`. Follows `var(--name)` chains via the
 * supplied map; this mirrors how Primer's CSS layers reference each other. */
function parseDimension(
  raw: string,
  vars: Record<string, string> = {},
): { value: number; unit: "px" | "rem" } {
  const resolved = resolveVar(raw, vars);
  const v = resolved.trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)\s*(px|rem)?$/);
  if (!m) throw new Error(`unexpected dimension '${raw}' (resolved to '${resolved}') from Primer CSS`);
  const n = Number(m[1]);
  const unit = (m[2] ?? "px") as "px" | "rem";
  return { value: n, unit };
}

interface AuthorOptions {
  /** When set, missing-Primer-variable warnings emit to stdout. Default off (silent). */
  verbose?: boolean;
}

/**
 * Build a complete Polymorph theme from Primer's published CSS. The output is what
 * `@polymorph/core.validateTheme` accepts; downstream `resolveTheme` produces the same
 * `ResolvedTheme` shape every adapter consumes.
 */
export function buildPolymorphThemeFromPrimer(
  declaredModes: ThemeMode[] = ["light", "dark"],
  opts: AuthorOptions = {},
): unknown {
  const baseVars = loadPrimerBase();
  const themed: Record<ThemeMode, Record<string, string>> = {} as Record<ThemeMode, Record<string, string>>;
  themed.light = loadPrimerTheme("light");
  if (declaredModes.includes("dark")) themed.dark = loadPrimerTheme("dark");
  if (declaredModes.includes("highContrast")) themed.highContrast = loadPrimerTheme("light-high-contrast");

  const theme: Record<string, unknown> = {
    contractVersion: "0.0.0",
    pm: {},
  };
  const pm = theme.pm as Record<string, unknown>;
  pm.modes = {} as Record<string, unknown>;
  const modes = pm.modes as Record<string, Record<string, unknown>>;

  const setPath = (root: Record<string, unknown>, segs: string[], leaf: unknown): void => {
    let cur = root;
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i]!;
      if (typeof cur[seg] !== "object" || cur[seg] === null) cur[seg] = {};
      cur = cur[seg] as Record<string, unknown>;
    }
    cur[segs[segs.length - 1]!] = leaf;
  };

  // Mode-sensitive: colors + elevation.
  for (const mode of declaredModes) {
    modes[mode] = {};
    const root = modes[mode]!;
    const themeVars = themed[mode];
    const defaults = mode === "dark" ? COLOR_DEFAULTS_DARK : COLOR_DEFAULTS_LIGHT;

    for (const [primerName, pmId] of COLOR_MAPPING) {
      const raw = themeVars[primerName];
      if (!raw) {
        if (opts.verbose) console.warn(`[primer] ${mode}: missing ${primerName}`);
        const fallback = defaults[pmId];
        if (!fallback) continue;
        setPath(root, pmId.replace(/^pm\./, "").split("."), {
          $type: "color",
          $value: normalizeHex(fallback, themeVars),
        });
        continue;
      }
      setPath(root, pmId.replace(/^pm\./, "").split("."), {
        $type: "color",
        $value: normalizeHex(raw, themeVars),
      });
    }
    for (const [pmId, hex] of Object.entries(defaults)) {
      const segs = pmId.replace(/^pm\./, "").split(".");
      let cur: unknown = root;
      let exists = true;
      for (const s of segs) {
        if (!cur || typeof cur !== "object" || !(s in (cur as Record<string, unknown>))) {
          exists = false;
          break;
        }
        cur = (cur as Record<string, unknown>)[s];
      }
      if (!exists) {
        setPath(root, segs, { $type: "color", $value: normalizeHex(hex, themeVars) });
      }
    }

    // Elevation — Primer ships shadows under `--shadow-resting-medium-shadow` etc.,
    // but they're composite values. We synthesise sensible defaults derived from
    // Primer's documented elevation system.
    const elevation = ((root as Record<string, unknown>).elevation = {} as Record<string, unknown>);
    elevation.flat = {
      $type: "shadow",
      $value: {
        color: "#00000000",
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 0, unit: "px" },
        blur: { value: 0, unit: "px" },
        spread: { value: 0, unit: "px" },
      },
    };
    elevation.raised = {
      $type: "shadow",
      $value: {
        color: mode === "dark" ? "#00000060" : "#1f232826",
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 1, unit: "px" },
        blur: { value: 0, unit: "px" },
        spread: { value: 0, unit: "px" },
      },
    };
    elevation.overlay = {
      $type: "shadow",
      $value: {
        color: mode === "dark" ? "#0d111880" : "#1f23282d",
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 8, unit: "px" },
        blur: { value: 24, unit: "px" },
        spread: { value: 0, unit: "px" },
      },
    };
  }

  // Mode-invariant: spacing + radius + typography + motion + opacity + size.
  for (const [primerName, pmId] of SPACE_MAPPING) {
    const raw = baseVars[primerName];
    if (!raw) {
      if (opts.verbose) console.warn(`[primer] missing base ${primerName}`);
      continue;
    }
    setPath(pm, pmId.replace(/^pm\./, "").split("."), {
      $type: "dimension",
      $value: parseDimension(raw, baseVars),
    });
  }
  setPath(pm, ["space", "none"], { $type: "dimension", $value: { value: 0, unit: "px" } });

  for (const [primerName, pmId] of RADIUS_MAPPING) {
    const raw = baseVars[primerName];
    if (!raw) continue;
    setPath(pm, pmId.replace(/^pm\./, "").split("."), {
      $type: "dimension",
      $value: parseDimension(raw, baseVars),
    });
  }
  setPath(pm, ["radius", "none"], { $type: "dimension", $value: { value: 0, unit: "px" } });
  setPath(pm, ["radius", "pill"], { $type: "dimension", $value: { value: 999, unit: "px" } });

  // Border widths — Primer documents 1px / 2px / 3px ladder; we map to hairline/thin/thick.
  setPath(pm, ["border", "width", "hairline"], { $type: "dimension", $value: { value: 1, unit: "px" } });
  setPath(pm, ["border", "width", "thin"], { $type: "dimension", $value: { value: 2, unit: "px" } });
  setPath(pm, ["border", "width", "thick"], { $type: "dimension", $value: { value: 3, unit: "px" } });

  // Opacity — Primer's `--opacity-muted` etc. aren't standardised; ship sensible defaults.
  setPath(pm, ["opacity", "disabled"], { $type: "number", $value: 0.4 });

  // Motion — Primer ships `--prim-duration-` family. Map directly.
  const motionDuration = {
    short: parseDimensionDurationFallback(baseVars["prim-duration-1"], 100),
    base: parseDimensionDurationFallback(baseVars["prim-duration-2"], 200),
    long: parseDimensionDurationFallback(baseVars["prim-duration-4"], 400),
    reduced: 1,
  };
  setPath(pm, ["motion", "duration", "short"], dur(motionDuration.short));
  setPath(pm, ["motion", "duration", "base"], dur(motionDuration.base));
  setPath(pm, ["motion", "duration", "long"], dur(motionDuration.long));
  setPath(pm, ["motion", "duration", "reduced"], dur(motionDuration.reduced));
  // Easing — Primer documents `cubic-bezier(0.65, 0, 0.35, 1)` as their standard.
  setPath(pm, ["motion", "easing", "standard"], { $type: "cubicBezier", $value: [0.65, 0, 0.35, 1] });

  // Typography — Primer ships `--text-body-size-medium` / `--text-body-weight-default`
  // etc. We compose typography tokens out of these.
  const typography = {
    display: composeTypography(baseVars, "display"),
    heading: composeTypography(baseVars, "title-medium"),
    body: composeTypography(baseVars, "body-medium"),
    label: composeTypography(baseVars, "body-small"),
    caption: composeTypography(baseVars, "subtitle"),
  };
  for (const [name, t] of Object.entries(typography)) {
    setPath(pm, ["typography", name], { $type: "typography", $value: t });
  }

  // Size — touchTarget min defaults to Primer's `--base-size-44` if present, else 44.
  const tt = baseVars["base-size-44"];
  setPath(pm, ["size", "touchTarget", "min"], {
    $type: "dimension",
    $value: tt ? parseDimension(tt, baseVars) : { value: 44, unit: "px" },
  });
  setPath(pm, ["size", "control", "md"], { $type: "dimension", $value: { value: 32, unit: "px" } });
  setPath(pm, ["size", "icon", "md"], { $type: "dimension", $value: { value: 16, unit: "px" } });

  return theme;
}

function parseDimensionDurationFallback(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const m = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*(ms|s)?$/);
  if (!m) return fallback;
  const n = Number(m[1]);
  return (m[2] ?? "ms") === "s" ? n * 1000 : n;
}

function dur(ms: number): { $type: "duration"; $value: { value: number; unit: "ms" } } {
  return { $type: "duration", $value: { value: ms, unit: "ms" } };
}

function composeTypography(
  base: Record<string, string>,
  variant: string,
): {
  fontFamily: string;
  fontWeight: number;
  fontSize: { value: number; unit: "px" | "rem" };
  lineHeight: number;
  letterSpacing: { value: number; unit: "px" };
} {
  const fontFamily = base["fontStack-sansSerif"] ?? base["fontStack-system"] ?? "Inter";
  const size = base[`text-${variant}-size`] ?? base["base-text-size-md"] ?? "1rem";
  const weight = base[`text-${variant}-weight`] ?? base["base-text-weight-normal"] ?? "400";
  const lh = base[`text-${variant}-lineHeight`] ?? base["base-text-lineHeight-normal"] ?? "1.5";
  return {
    fontFamily,
    fontWeight: Number(resolveVar(weight, base)) || 400,
    fontSize: parseDimension(size, base),
    lineHeight: Number(resolveVar(lh, base)) || 1.5,
    letterSpacing: { value: 0, unit: "px" },
  };
}
