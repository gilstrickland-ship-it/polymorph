import { describe, it, expect } from "vitest";
import { ALL_TOKEN_IDS, REQUIRED_TOKEN_IDS, COMPONENT_ROLES, TOKENS } from "../src/index.js";
import { readJson } from "./helpers.js";

const manifest = readJson("manifest/semantic-vocabulary.v0.json") as {
  tokens: { id: string; required: boolean; modeSensitive: boolean }[];
  componentRoles: { role: string; properties: { property: string; defaultsFrom: string }[] }[];
};
const themeSchema = readJson("schema/theme.schema.json") as any;

const sorted = (xs: readonly string[]) => [...xs].sort();

describe("manifest ↔ generated types consistency (T028)", () => {
  it("generated ids match the manifest", () => {
    expect(sorted(ALL_TOKEN_IDS)).toEqual(sorted(manifest.tokens.map((t) => t.id)));
  });
  it("generated required set matches the manifest", () => {
    expect(sorted(REQUIRED_TOKEN_IDS)).toEqual(sorted(manifest.tokens.filter((t) => t.required).map((t) => t.id)));
  });
  it("generated roles match the manifest and all defaultsFrom are real ids", () => {
    expect(sorted(COMPONENT_ROLES.map((r) => r.role))).toEqual(sorted(manifest.componentRoles.map((r) => r.role)));
    const ids = new Set(ALL_TOKEN_IDS);
    for (const r of manifest.componentRoles) {
      for (const p of r.properties) expect(ids.has(p.defaultsFrom as never), `${r.role}.${p.property}`).toBe(true);
    }
  });
});

describe("manifest ↔ schema consistency (T028)", () => {
  // descend through `properties` chain; returns { exists, requiredAllTheWay }
  function probe(base: any, segs: string[]): { exists: boolean; required: boolean } {
    let node = base;
    let required = true;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i]!;
      const props = node?.properties;
      if (!props || !(seg in props)) return { exists: false, required: false };
      if (!Array.isArray(node.required) || !node.required.includes(seg)) required = false;
      node = props[seg];
    }
    return { exists: true, required };
  }

  const pm = themeSchema.properties.pm;
  const light = pm.properties.modes.properties.light;

  it("every token has a schema property under the correct location", () => {
    for (const t of TOKENS) {
      const segs = t.id.replace(/^pm\./, "").split(".");
      const base = t.modeSensitive ? light : pm;
      const { exists } = probe(base, segs);
      expect(exists, `${t.id} present in schema`).toBe(true);
    }
  });

  it("every required token is enforced as required (all ancestors required)", () => {
    for (const t of TOKENS) {
      if (!t.required) continue;
      const segs = t.id.replace(/^pm\./, "").split(".");
      const base = t.modeSensitive ? light : pm;
      const { required } = probe(base, segs);
      expect(required, `${t.id} required in schema`).toBe(true);
    }
  });
});
