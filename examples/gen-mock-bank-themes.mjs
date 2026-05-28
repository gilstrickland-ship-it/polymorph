// Generates two complete, valid, visually-distinct mock-bank themes from the contract manifest.
// Run: node examples/gen-mock-bank-themes.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(join(root, "..", "packages", "spec", "manifest", "semantic-vocabulary.v0.json"), "utf8"),
);

// --- tiny hex helpers --------------------------------------------------------
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const parse = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const toHex = ([r, g, b]) => "#" + [r, g, b].map((c) => clamp(c).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return toHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
};
const darken = (hex, t = 0.2) => mix(hex, "#000000", t);
const lighten = (hex, t = 0.2) => mix(hex, "#ffffff", t);

// --- per-bank design language ------------------------------------------------
const banks = {
  aurora: {
    // cool, airy, rounded
    primary: "#1f5cff",
    secondary: "#5b6b7f",
    danger: "#d23b3b",
    success: "#1f9d57",
    warning: "#c98a00",
    info: "#1f86c9",
    family: "Inter",
    spaceStep: 4, // 4,8,16,... airy
    radius: { none: 0, control: 10, card: 16, pill: 999, full: 9999 },
    light: { bg: "#ffffff", raised: "#f4f7ff", ink: "#0b1b2b", muted: "#5a6b7b", border: "#d6e0ee" },
    dark: { bg: "#0b1320", raised: "#141f33", ink: "#eef3fb", muted: "#9fb0c4", border: "#27344a" },
  },
  borealis: {
    // warm, dense, sharp
    primary: "#0f7a5a",
    secondary: "#7a6a52",
    danger: "#b23030",
    success: "#2e8b4f",
    warning: "#b3791f",
    info: "#2f6f8f",
    family: "Georgia",
    spaceStep: 3, // 3,6,12,... denser
    radius: { none: 0, control: 4, card: 6, pill: 999, full: 9999 },
    light: { bg: "#fbf8f3", raised: "#f3ece0", ink: "#231b12", muted: "#6b5e4d", border: "#ddd0bd" },
    dark: { bg: "#16120c", raised: "#231c12", ink: "#f3ece0", muted: "#b6a890", border: "#3a3022" },
  },
};

const fontWeight = (id) =>
  id.includes("heading") || id.includes("display") || id.endsWith("Strong") || id.endsWith("label") ? 600 : 400;
const fontSizePx = (id) => {
  if (id.endsWith("display")) return 36;
  if (id === "pm.typography.heading") return 24;
  if (id.endsWith("headingSm")) return 18;
  if (id.endsWith("caption")) return 12;
  if (id.endsWith("label")) return 14;
  return 16; // body / bodyStrong / mono
};

function colorFor(id, b, mode) {
  const m = b[mode];
  const map = {
    "pm.color.surface.base": m.bg,
    "pm.color.surface.raised": m.raised,
    "pm.color.surface.sunken": darken(m.bg, mode === "light" ? 0.04 : -0.0),
    "pm.color.surface.overlay": m.raised,
    "pm.color.surface.inverse": m.ink,
    "pm.color.text.body": m.ink,
    "pm.color.text.muted": m.muted,
    "pm.color.text.subtle": lighten(m.muted, 0.15),
    "pm.color.text.onAction": "#ffffff",
    "pm.color.text.onInverse": m.bg,
    "pm.color.text.link": b.primary,
    "pm.color.text.disabled": mix(m.muted, m.bg, 0.4),
    "pm.color.action.primary.rest": b.primary,
    "pm.color.action.primary.hover": darken(b.primary, 0.1),
    "pm.color.action.primary.pressed": darken(b.primary, 0.2),
    "pm.color.action.primary.disabled": mix(b.primary, m.bg, 0.55),
    "pm.color.action.secondary.rest": b.secondary,
    "pm.color.action.secondary.pressed": darken(b.secondary, 0.2),
    "pm.color.action.danger.rest": b.danger,
    "pm.color.action.danger.pressed": darken(b.danger, 0.2),
    "pm.color.feedback.success": b.success,
    "pm.color.feedback.warning": b.warning,
    "pm.color.feedback.error": b.danger,
    "pm.color.feedback.info": b.info,
    "pm.color.border.default": m.border,
    "pm.color.border.subtle": lighten(m.border, 0.4),
    "pm.color.border.strong": darken(m.border, 0.2),
    "pm.color.border.focus": b.primary,
  };
  return map[id] ?? m.ink;
}

const spaceScale = (b) => {
  const s = b.spaceStep;
  return {
    "pm.space.none": 0,
    "pm.space.xs": s,
    "pm.space.sm": s * 2,
    "pm.space.md": s * 4,
    "pm.space.lg": s * 6,
    "pm.space.xl": s * 8,
    "pm.space.2xl": s * 12,
    "pm.space.3xl": s * 16,
  };
};
function dimFor(id, b) {
  const sp = spaceScale(b);
  if (id in sp) return sp[id];
  const r = b.radius;
  const map = {
    "pm.radius.none": r.none,
    "pm.radius.control": r.control,
    "pm.radius.card": r.card,
    "pm.radius.pill": r.pill,
    "pm.radius.full": r.full,
    "pm.border.width.hairline": 1,
    "pm.border.width.thin": 1.5,
    "pm.border.width.thick": 3,
    "pm.size.control.sm": 36,
    "pm.size.control.md": 48,
    "pm.size.control.lg": 56,
    "pm.size.touchTarget.min": 48,
    "pm.size.icon.md": 24,
  };
  return map[id] ?? 8;
}

function shadowFor(id, mode) {
  if (id.endsWith("flat")) return { color: "#00000000", offsetX: px(0), offsetY: px(0), blur: px(0), spread: px(0) };
  const a = mode === "dark" ? "66" : "22";
  const y = id.endsWith("overlay") ? 8 : 2;
  const blur = id.endsWith("overlay") ? 24 : 6;
  return { color: `#000000${a}`, offsetX: px(0), offsetY: px(y), blur: px(blur), spread: px(0) };
}
const px = (value) => ({ value, unit: "px" });

function valueFor(tok, b, mode) {
  switch (tok.type) {
    case "color":
      return colorFor(tok.id, b, mode);
    case "dimension":
      return px(dimFor(tok.id, b));
    case "duration":
      if (tok.id.endsWith("reduced")) return { value: 1, unit: "ms" };
      if (tok.id.endsWith("short")) return { value: 120, unit: "ms" };
      if (tok.id.endsWith("long")) return { value: 400, unit: "ms" };
      return { value: 220, unit: "ms" };
    case "cubicBezier":
      if (tok.id.endsWith("reduced")) return [0, 0, 1, 1];
      if (tok.id.endsWith("emphasized")) return [0.2, 0, 0, 1];
      return [0.4, 0, 0.2, 1];
    case "number":
      return tok.id.endsWith("disabled") ? 0.4 : tok.id.endsWith("muted") ? 0.6 : 0.5;
    case "typography":
      return {
        fontFamily: b.family,
        fontWeight: fontWeight(tok.id),
        fontSize: px(fontSizePx(tok.id)),
        lineHeight: 1.4,
        letterSpacing: px(0),
      };
    case "shadow":
      return shadowFor(tok.id, mode);
    default:
      throw new Error("unhandled type " + tok.type);
  }
}

function setPath(root, segs, leaf) {
  let cur = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    cur[s] ??= {};
    cur = cur[s];
  }
  cur[segs[segs.length - 1]] = leaf;
}

function buildTheme(bankName) {
  const b = banks[bankName];
  const theme = { contractVersion: "0.0.0", pm: { modes: { light: {}, dark: {} } } };
  for (const tok of manifest.tokens) {
    const token = (mode) => ({ $type: tok.type, $value: valueFor(tok, b, mode) });
    const rel = tok.id.replace(/^pm\./, "");
    if (tok.modeSensitive) {
      for (const mode of ["light", "dark"]) setPath(theme.pm.modes[mode], rel.split("."), token(mode));
    } else {
      setPath(theme.pm, rel.split("."), token("light"));
    }
  }
  return theme;
}

for (const [name, dir] of [
  ["aurora", "mock-bank-aurora"],
  ["borealis", "mock-bank-borealis"],
]) {
  const out = join(root, dir, "theme");
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${name}.tokens.json`), JSON.stringify(buildTheme(name), null, 2) + "\n");
  console.log(`wrote ${dir}/theme/${name}.tokens.json`);
}
