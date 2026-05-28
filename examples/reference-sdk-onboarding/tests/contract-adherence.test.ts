import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sources(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}
const files = sources(srcDir).map((p) => ({ p, text: readFileSync(p, "utf8") }));

describe("reference SDK is coded against the contract only (SC-001, Principle I)", () => {
  it("contains no hard-coded colors", () => {
    for (const { p, text } of files) {
      expect(/#[0-9a-fA-F]{3,8}\b/.test(text), `${p} has a hex color`).toBe(false);
      expect(/\brgba?\s*\(/.test(text), `${p} has an rgb() color`).toBe(false);
    }
  });

  it("never imports react-native or a mock-bank package directly", () => {
    for (const { p, text } of files) {
      expect(/from\s+["']react-native["']/.test(text), `${p} imports react-native`).toBe(false);
      expect(/from\s+["']@polymorph\/example-mock-bank/.test(text), `${p} imports a bank`).toBe(false);
    }
  });

  it("only depends on the adapter, the spec types, and react", () => {
    const allowed = /^(@polymorph\/adapter-react-native|@polymorph\/spec|react|\.\/)/;
    const importRe = /from\s+["']([^"']+)["']/g;
    for (const { p, text } of files) {
      for (const m of text.matchAll(importRe)) {
        expect(allowed.test(m[1]!), `${p} imports disallowed module ${m[1]}`).toBe(true);
      }
    }
  });
});
