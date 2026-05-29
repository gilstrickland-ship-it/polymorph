/**
 * Generates, from the canonical manifest (manifest/semantic-vocabulary.v0.json):
 *   - src/generated/contract-ids.ts   (SemanticTokenId / ComponentRole unions + data consts)
 *   - schema/theme.schema.json        (JSON Schema 2020-12 for a full theme file)
 *   - schema/components.schema.json    (component-role override shapes, $ref'd by theme)
 *
 * The manifest is the single source of truth (research R7); run `pnpm --filter @polymorph/spec generate`
 * after editing it. `tests/manifest.test.ts` asserts the generated artifacts stay consistent.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");

interface TokenEntry {
  id: string;
  type: string;
  required: boolean;
  modeSensitive: boolean;
  group: string;
  description?: string;
  /**
   * Optional accessibility annotation read by the advisory lint. `decorative` tokens skip
   * non-text contrast checks — design-system convention treats default/subtle borders as
   * visual hairlines, not informational separators. `informational` (or absent) keeps the
   * default 3:1 floor.
   */
  accessibility?: "informational" | "decorative";
}
interface RoleEntry {
  role: string;
  properties: { property: string; defaultsFrom: string }[];
}
interface Manifest {
  contractVersion: string;
  dtcgBaseVersion: string;
  namespace: string;
  modes: { default: string; supported: string[] };
  tokens: TokenEntry[];
  componentRoles: RoleEntry[];
}

const manifest: Manifest = JSON.parse(
  readFileSync(join(pkgRoot, "manifest", "semantic-vocabulary.v0.json"), "utf8"),
);

interface ProtectedFloorRule {
  kind: "contrast" | "fontSize" | "lineHeight";
  fgProperty?: string;
  viaProperty?: string;
  bgToken?: string;
  min?: number;
  minPx?: number;
  code: string;
}
interface ProtectedFloor {
  role: string;
  rationale?: string;
  rules: ProtectedFloorRule[];
}
interface ProtectedManifest {
  version: string;
  floors: ProtectedFloor[];
}
const protectedManifest: ProtectedManifest = JSON.parse(
  readFileSync(join(pkgRoot, "manifest", "protected-floors.v0.json"), "utf8"),
);

const DTCG = "https://polymorph.dev/schema/dtcg-types.schema.json#/$defs/";
const typeRef = (t: string) => ({ $ref: DTCG + t });

const typeOfId = new Map(manifest.tokens.map((t) => [t.id, t.type]));

// ---- JSON Schema: nested object builder -------------------------------------

interface SchemaNode {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
}
const node = (): SchemaNode => ({ type: "object", properties: {}, required: [], additionalProperties: false });

/** Build a nested object schema from a set of tokens (ids already stripped of the `pm.` prefix). */
function buildNested(tokens: TokenEntry[]): SchemaNode {
  const root = node();
  for (const tok of tokens) {
    const segs = tok.id.replace(/^pm\./, "").split(".");
    let cur = root;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i]!;
      const isLeaf = i === segs.length - 1;
      if (isLeaf) {
        cur.properties[seg] = typeRef(tok.type);
        if (tok.required && !cur.required.includes(seg)) cur.required.push(seg);
      } else {
        if (!cur.properties[seg]) cur.properties[seg] = node();
        const child = cur.properties[seg] as SchemaNode;
        // ancestor of a required leaf must itself be required
        if (tok.required && !cur.required.includes(seg)) cur.required.push(seg);
        cur = child;
      }
    }
  }
  return root;
}

const sortRequired = (n: SchemaNode) => {
  n.required.sort();
  for (const v of Object.values(n.properties)) if (v && (v as SchemaNode).type === "object") sortRequired(v as SchemaNode);
};

const modeInvariant = manifest.tokens.filter((t) => !t.modeSensitive);
const modeSensitive = manifest.tokens.filter((t) => t.modeSensitive);

const invariantSchema = buildNested(modeInvariant); // groups: space, radius, border, motion, size, opacity, typography
const modeSetSchema = buildNested(modeSensitive); // groups: color, elevation
sortRequired(invariantSchema);
sortRequired(modeSetSchema);

// ---- components.schema.json --------------------------------------------------

const roleGroups: Record<string, SchemaNode> = {};
for (const r of manifest.componentRoles) {
  const segs = r.role.split(".");
  const top = segs[0]!;
  const roleObj = node();
  // role properties are all optional overrides; type inferred from the defaultsFrom token
  (roleObj.required as string[]).length = 0;
  for (const p of r.properties) {
    const t = typeOfId.get(p.defaultsFrom);
    if (!t) throw new Error(`Role ${r.role} property ${p.property} defaultsFrom unknown id ${p.defaultsFrom}`);
    roleObj.properties[p.property] = typeRef(t);
  }
  if (segs.length === 1) {
    roleGroups[top] = roleObj;
  } else {
    const variant = segs[1]!;
    if (!roleGroups[top]) roleGroups[top] = node();
    (roleGroups[top]!.properties as Record<string, unknown>)[variant] = roleObj;
  }
}

const componentsSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://polymorph.dev/schema/components.schema.json",
  title: "Polymorph optional component-token overrides (closed v0 role set)",
  $defs: roleGroups,
};

// ---- theme.schema.json -------------------------------------------------------

const COMPONENTS = "https://polymorph.dev/schema/components.schema.json#/$defs/";
const pmProps: Record<string, unknown> = { ...invariantSchema.properties };
for (const top of Object.keys(roleGroups)) pmProps[top] = { $ref: COMPONENTS + top };

const modeSet = { ...modeSetSchema };
const pmRequired = [...invariantSchema.required, "modes"].sort();

const themeSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://polymorph.dev/schema/theme.schema.json",
  title: "Polymorph theme file",
  type: "object",
  required: ["pm"],
  properties: {
    $schema: { type: "string" },
    contractVersion: { type: "string" },
    pm: {
      type: "object",
      additionalProperties: false,
      required: pmRequired,
      properties: {
        ...pmProps,
        modes: {
          type: "object",
          additionalProperties: false,
          required: ["light"],
          properties: {
            light: modeSet,
            dark: modeSet,
            highContrast: modeSet,
          },
        },
      },
    },
  },
  additionalProperties: true,
};

// ---- src/generated/contract-ids.ts ------------------------------------------

const ids = manifest.tokens.map((t) => t.id);
const required = manifest.tokens.filter((t) => t.required).map((t) => t.id);
const modeSensitiveIds = modeSensitive.map((t) => t.id);
const roles = manifest.componentRoles.map((r) => r.role);
const types = [...new Set(manifest.tokens.map((t) => t.type))].sort();

const union = (xs: string[]) => xs.map((x) => `  | ${JSON.stringify(x)}`).join("\n");
const arr = (xs: string[]) => xs.map((x) => `  ${JSON.stringify(x)},`).join("\n");

const ts = `// AUTO-GENERATED from manifest/semantic-vocabulary.v0.json — DO NOT EDIT.
// Run \`pnpm --filter @polymorph/spec generate\` to regenerate.

export type TokenType =
${union(types)};

export type SemanticTokenId =
${union(ids)};

export type ComponentRole =
${union(roles)};

export interface ManifestTokenEntry {
  id: SemanticTokenId;
  type: TokenType;
  required: boolean;
  modeSensitive: boolean;
  group: string;
  /** Optional accessibility annotation. \`decorative\` tokens skip non-text contrast checks. */
  accessibility?: "informational" | "decorative";
}

export interface ComponentRoleEntry {
  role: ComponentRole;
  properties: ReadonlyArray<{ property: string; defaultsFrom: SemanticTokenId }>;
}

export const CONTRACT_VERSION = ${JSON.stringify(manifest.contractVersion)};
export const DTCG_BASE_VERSION = ${JSON.stringify(manifest.dtcgBaseVersion)};
export const DEFAULT_MODE = ${JSON.stringify(manifest.modes.default)};
export const SUPPORTED_MODES = [
${arr(manifest.modes.supported)}
] as const;

export const ALL_TOKEN_IDS: readonly SemanticTokenId[] = [
${arr(ids)}
];

export const REQUIRED_TOKEN_IDS: readonly SemanticTokenId[] = [
${arr(required)}
];

export const MODE_SENSITIVE_TOKEN_IDS: readonly SemanticTokenId[] = [
${arr(modeSensitiveIds)}
];

export const TOKENS: readonly ManifestTokenEntry[] = ${JSON.stringify(
  manifest.tokens.map((t) => {
    const out: Record<string, unknown> = {
      id: t.id,
      type: t.type,
      required: t.required,
      modeSensitive: t.modeSensitive,
      group: t.group,
    };
    if (t.accessibility !== undefined) out.accessibility = t.accessibility;
    return out;
  }),
  null,
  2,
)} as const;

export const COMPONENT_ROLES: readonly ComponentRoleEntry[] = ${JSON.stringify(
  manifest.componentRoles.map((r) => ({ role: r.role, properties: r.properties })),
  null,
  2,
)} as const;

export type ProtectedFloorKind = "contrast" | "fontSize" | "lineHeight";

export interface ProtectedFloorRule {
  kind: ProtectedFloorKind;
  /** Component-role property holding the foreground (contrast rule). */
  fgProperty?: string;
  /** Component-role property holding a typography composite (fontSize / lineHeight rules). */
  viaProperty?: string;
  /** Background \`pm.*\` token id the contrast rule reads from (mode-resolved at lint time). */
  bgToken?: SemanticTokenId;
  /** Minimum value (contrast ratio, line-height). */
  min?: number;
  /** Minimum pixel size (font-size). */
  minPx?: number;
  /** The lint code that fires on violation. */
  code: string;
}

export interface ProtectedFloor {
  role: ComponentRole;
  rationale?: string;
  rules: readonly ProtectedFloorRule[];
}

export const PROTECTED_FLOORS: readonly ProtectedFloor[] = ${JSON.stringify(
  protectedManifest.floors,
  null,
  2,
)} as const;
`;

// Embed all three schemas as TS objects so consumers (e.g. @polymorph/core) can import them
// without a cross-package JSON import (RN-safe; avoids rootDir emit issues). The standalone
// schema/*.json files remain for non-JS toolchains.
const dtcgTypesSchema = JSON.parse(readFileSync(join(pkgRoot, "schema", "dtcg-types.schema.json"), "utf8"));
const schemasTs = `// AUTO-GENERATED from manifest/ + schema/ — DO NOT EDIT.
// Run \`pnpm --filter @polymorph/spec generate\` to regenerate.

export const dtcgTypesSchema: Record<string, unknown> = ${JSON.stringify(dtcgTypesSchema, null, 2)};

export const componentsSchema: Record<string, unknown> = ${JSON.stringify(componentsSchema, null, 2)};

export const themeSchema: Record<string, unknown> = ${JSON.stringify(themeSchema, null, 2)};
`;

writeFileSync(join(pkgRoot, "src", "generated", "contract-ids.ts"), ts);
writeFileSync(join(pkgRoot, "src", "generated", "schemas.ts"), schemasTs);
writeFileSync(join(pkgRoot, "schema", "theme.schema.json"), JSON.stringify(themeSchema, null, 2) + "\n");
writeFileSync(join(pkgRoot, "schema", "components.schema.json"), JSON.stringify(componentsSchema, null, 2) + "\n");

console.log(
  `generated: ${ids.length} tokens (${required.length} required), ${roles.length} roles, types [${types.join(", ")}]`,
);
