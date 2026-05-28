import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runThemeConformance, assertConforms, checkLoaderEquivalence } from "../src/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const load = (p: string): unknown => JSON.parse(readFileSync(p, "utf8"));
const bank = (n: string): unknown => load(join(root, "examples", `mock-bank-${n}`, "theme", `${n}.tokens.json`));
const specFix = (kind: "valid" | "invalid", name: string): unknown =>
  load(join(root, "packages", "spec", "tests", "fixtures", kind, `${name}.tokens.json`));

const failed = (theme: unknown): string => JSON.stringify(runThemeConformance(theme).checks.filter((c) => !c.passed));

describe("theme conformance — mock banks (v1 acceptance corpus)", () => {
  for (const n of ["aurora", "borealis"]) {
    it(`${n} conforms to the contract`, () => {
      expect(runThemeConformance(bank(n)).passed, failed(bank(n))).toBe(true);
    });
  }
});

describe("theme conformance — @polymorph/spec fixtures", () => {
  it("valid fixtures conform", () => {
    for (const f of ["minimal-light", "light-dark", "with-components"]) {
      expect(runThemeConformance(specFix("valid", f)).passed, f).toBe(true);
    }
  });
  it("invalid fixtures do not conform", () => {
    for (const f of ["missing-required", "type-mismatch", "unknown-role", "partial-dark"]) {
      expect(runThemeConformance(specFix("invalid", f)).passed, f).toBe(false);
    }
  });
});

describe("loader equivalence", () => {
  it("holds for both banks across modes", async () => {
    for (const n of ["aurora", "borealis"]) {
      for (const m of ["light", "dark"] as const) {
        const c = await checkLoaderEquivalence(bank(n), m);
        expect(c.passed, `${n} ${m}: ${c.detail ?? ""}`).toBe(true);
      }
    }
  });
});

describe("assertConforms", () => {
  it("passes for a bank theme and throws (listing failures) for an invalid one", () => {
    expect(() => assertConforms(bank("aurora"), "aurora")).not.toThrow();
    expect(() => assertConforms(specFix("invalid", "missing-required"), "bad")).toThrow(/failed conformance/);
  });
});
