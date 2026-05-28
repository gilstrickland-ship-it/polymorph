// Generates a representative Tokens Studio (single-file) export covering every Polymorph
// token in the manifest, plus a complete mapping from Polymorph ids → Tokens Studio paths.
// Together they form the end-to-end importer test corpus.
//
// Run: node tooling/authoring/scripts/gen-tokens-studio-fixture.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(root, "..");
const repoRoot = join(pkgRoot, "..", "..");
const manifest = JSON.parse(
  readFileSync(join(repoRoot, "packages", "spec", "manifest", "semantic-vocabulary.v0.json"), "utf8"),
);

// Polymorph $type → a representative Tokens Studio token shape.
function tsTokenFor(polyType, modeHint) {
  switch (polyType) {
    case "color":
      return { value: modeHint === "dark" ? "#0b1320" : "#1f2933", type: "color" };
    case "dimension":
      return { value: "8px", type: "dimension" };
    case "duration":
      return { value: 200, type: "duration" };
    case "number":
      return { value: "40%", type: "opacity" };
    case "cubicBezier":
      return { value: [0.4, 0, 0.2, 1], type: "cubicBezier" };
    case "typography":
      return {
        value: { fontFamily: "Inter", fontWeight: "Regular", fontSize: "16px", lineHeight: "1.4", letterSpacing: "0px" },
        type: "typography",
      };
    case "shadow":
      return {
        value: { x: "0", y: "1px", blur: "2px", spread: "0", color: "#00000022", type: "dropShadow" },
        type: "boxShadow",
      };
    default:
      throw new Error("no TS sample for type " + polyType);
  }
}

// Place a token at a dotted path inside a Tokens Studio set.
function setPath(root, segs, leaf) {
  let cur = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    if (!cur[s] || typeof cur[s] !== "object") cur[s] = {};
    cur = cur[s];
  }
  cur[segs[segs.length - 1]] = leaf;
}

// Tokens Studio path for a Polymorph id: drop the `pm.` prefix, keep the rest dotted.
const tsPathOf = (pmId) => pmId.replace(/^pm\./, "");

// Build the export.
const exportObj = {
  global: {},
  light: {},
  dark: {},
  $themes: [
    { name: "Light", selectedTokenSets: { global: "enabled", light: "enabled" } },
    { name: "Dark", selectedTokenSets: { global: "enabled", dark: "enabled" } },
  ],
  $metadata: { tokenSetOrder: ["global", "light", "dark"] },
};

const mapping = {
  invariant: { sets: ["global"], ids: {} },
  modes: {
    light: { sets: ["global", "light"], ids: {} },
    dark: { sets: ["global", "dark"], ids: {} },
  },
};

for (const tok of manifest.tokens) {
  const tsPath = tsPathOf(tok.id);
  if (tok.modeSensitive) {
    setPath(exportObj.light, tsPath.split("."), tsTokenFor(tok.type, "light"));
    setPath(exportObj.dark, tsPath.split("."), tsTokenFor(tok.type, "dark"));
    mapping.modes.light.ids[tok.id] = tsPath;
    mapping.modes.dark.ids[tok.id] = tsPath;
  } else {
    setPath(exportObj.global, tsPath.split("."), tsTokenFor(tok.type));
    mapping.invariant.ids[tok.id] = tsPath;
  }
}

const out = join(pkgRoot, "tests", "fixtures");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "tokens-studio.export.json"), JSON.stringify(exportObj, null, 2) + "\n");
writeFileSync(join(out, "mapping.json"), JSON.stringify(mapping, null, 2) + "\n");

const invariantCount = Object.keys(mapping.invariant.ids).length;
const lightCount = Object.keys(mapping.modes.light.ids).length;
console.log(`wrote ${invariantCount} invariant mappings + ${lightCount} per-mode mappings`);
