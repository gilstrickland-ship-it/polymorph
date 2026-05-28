/**
 * Deterministically generates test fixtures from the manifest so the valid theme provably
 * contains every required token, and each invalid theme differs from a valid one by exactly one
 * intended defect. Run via `pnpm --filter @polymorph/spec exec tsx scripts/gen-fixtures.ts`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");

interface TokenEntry { id: string; type: string; required: boolean; modeSensitive: boolean; }
interface Manifest { tokens: TokenEntry[]; }
const manifest: Manifest = JSON.parse(readFileSync(join(pkgRoot, "manifest", "semantic-vocabulary.v0.json"), "utf8"));

type Json = Record<string, unknown>;

function valueFor(type: string): unknown {
  switch (type) {
    case "color": return "#1f2933";
    case "dimension": return { value: 8, unit: "px" };
    case "duration": return { value: 200, unit: "ms" };
    case "number": return 0.5;
    case "cubicBezier": return [0.4, 0, 0.2, 1];
    case "typography": return { fontFamily: "Inter", fontWeight: 400, fontSize: { value: 16, unit: "px" }, lineHeight: 1.5, letterSpacing: { value: 0, unit: "px" } };
    case "shadow": return { color: "#00000022", offsetX: { value: 0, unit: "px" }, offsetY: { value: 1, unit: "px" }, blur: { value: 2, unit: "px" }, spread: { value: 0, unit: "px" } };
    default: throw new Error("no sample value for type " + type);
  }
}

function setPath(root: Json, segs: string[], leaf: unknown): void {
  let cur = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]!;
    if (typeof cur[seg] !== "object" || cur[seg] === null) cur[seg] = {};
    cur = cur[seg] as Json;
  }
  cur[segs[segs.length - 1]!] = leaf;
}

function delPath(root: Json, segs: string[]): void {
  let cur = root;
  for (let i = 0; i < segs.length - 1; i++) cur = cur[segs[i]!] as Json;
  delete cur[segs[segs.length - 1]!];
}

const token = (type: string) => ({ $type: type, $value: valueFor(type) });

/** Build a valid theme; `modes` lists which modes to populate with the required mode-sensitive set. */
function buildValid(modes: string[]): Json {
  const theme: Json = { $schema: "../../../schema/theme.schema.json", contractVersion: "0.0.0", pm: {} };
  const pm = theme.pm as Json;
  pm.modes = {};
  const modesObj = pm.modes as Json;
  for (const m of modes) modesObj[m] = {};

  for (const tok of manifest.tokens) {
    if (!tok.required) continue;
    const rel = tok.id.replace(/^pm\./, "");
    if (tok.modeSensitive) {
      for (const m of modes) setPath(modesObj[m] as Json, rel.split("."), token(tok.type));
    } else {
      setPath(pm, rel.split("."), token(tok.type));
    }
  }
  return theme;
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const write = (sub: string, name: string, data: unknown) =>
  writeFileSync(join(pkgRoot, "tests", "fixtures", sub, name), JSON.stringify(data, null, 2) + "\n");

// ---- valid ------------------------------------------------------------------
const minimalLight = buildValid(["light"]);
write("valid", "minimal-light.tokens.json", minimalLight);

const lightDark = buildValid(["light", "dark"]);
write("valid", "light-dark.tokens.json", lightDark);

const withComponents = clone(minimalLight) as Json;
setPath(withComponents.pm as Json, ["button", "primary", "radius"], token("dimension"));
setPath(withComponents.pm as Json, ["input", "border"], token("color"));
write("valid", "with-components.tokens.json", withComponents);

// ---- invalid (single defect each) -------------------------------------------
const missing = clone(minimalLight) as Json;
delPath((missing.pm as Json).modes as Json, ["light", "color", "text", "body"]);
write("invalid", "missing-required.tokens.json", missing);

const typeMismatch = clone(minimalLight) as Json;
setPath((typeMismatch.pm as Json).modes as Json, ["light", "color", "surface", "base"], token("dimension"));
write("invalid", "type-mismatch.tokens.json", typeMismatch);

const pmCollision = clone(minimalLight) as Json;
(pmCollision.pm as Json).palette = { brand: token("color") }; // FI primitive smuggled under pm
write("invalid", "pm-collision.tokens.json", pmCollision);

const unknownId = clone(minimalLight) as Json;
setPath((unknownId.pm as Json).modes as Json, ["light", "color", "surface", "bogus"], token("color"));
write("invalid", "unknown-pm-id.tokens.json", unknownId);

const unknownRole = clone(minimalLight) as Json;
setPath(unknownRole.pm as Json, ["button", "tertiary", "background"], token("color"));
write("invalid", "unknown-role.tokens.json", unknownRole);

const partialDark = clone(lightDark) as Json;
delPath((partialDark.pm as Json).modes as Json, ["dark", "color", "text", "body"]);
write("invalid", "partial-dark.tokens.json", partialDark);

console.log("fixtures written: 3 valid, 6 invalid");
