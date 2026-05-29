import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  resolveTheme,
  definePolicyPack,
  lintWithPolicies,
  lintAllModesWithPolicies,
  filterWarnings,
  warning,
} from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const aurora = JSON.parse(
  readFileSync(
    join(here, "..", "..", "..", "examples", "mock-bank-aurora", "theme", "aurora.tokens.json"),
    "utf8",
  ),
);

describe("definePolicyPack", () => {
  it("returns the pack unchanged (compile-time type guard only)", () => {
    const pack = definePolicyPack({
      name: "test/example",
      version: "0.1.0",
      rules: [],
    });
    expect(pack.name).toBe("test/example");
    expect(pack.version).toBe("0.1.0");
  });
});

describe("lintWithPolicies — built-in + custom rules compose", () => {
  const rt = resolveTheme(aurora, "light");

  it("returns at least the built-in warning set when no packs are supplied", () => {
    const a = lintWithPolicies(rt);
    const b = lintWithPolicies(rt, []);
    expect(a.length).toBe(b.length);
    expect(a.length).toBeGreaterThan(0); // aurora has known lint warnings
  });

  it("appends pack warnings after the built-in set in deterministic order", () => {
    const pack = definePolicyPack({
      name: "test/marker",
      version: "0.0.1",
      rules: [
        () => [warning("FIRST", "first rule")],
        () => [warning("SECOND", "second rule")],
      ],
    });
    const all = lintWithPolicies(rt, [pack]);
    const codes = all.map((w) => w.code);
    const firstIdx = codes.indexOf("FIRST");
    const secondIdx = codes.indexOf("SECOND");
    expect(firstIdx).toBeGreaterThan(-1);
    expect(secondIdx).toBeGreaterThan(firstIdx);
  });

  it("multiple packs fire in pack-array order", () => {
    const a = definePolicyPack({ name: "a", version: "0", rules: [() => [warning("FROM_A", "")]] });
    const b = definePolicyPack({ name: "b", version: "0", rules: [() => [warning("FROM_B", "")]] });
    const all = lintWithPolicies(rt, [a, b]);
    const aIdx = all.findIndex((w) => w.code === "FROM_A");
    const bIdx = all.findIndex((w) => w.code === "FROM_B");
    expect(aIdx).toBeLessThan(bIdx);
  });

  it("a rule that throws is swallowed and surfaces as POLICY_RULE_ERROR", () => {
    const pack = definePolicyPack({
      name: "test/throws",
      version: "1.0",
      rules: [
        () => {
          throw new Error("oops");
        },
        () => [warning("AFTER_THROW", "subsequent rules still run")],
      ],
    });
    const all = lintWithPolicies(rt, [pack]);
    const err = all.find((w) => w.code === "POLICY_RULE_ERROR");
    expect(err).toBeDefined();
    expect(err?.message).toContain("test/throws");
    expect(err?.message).toContain("v1.0");
    expect(err?.message).toContain("oops");
    // Subsequent rules in the same pack still run after one throws.
    expect(all.some((w) => w.code === "AFTER_THROW")).toBe(true);
  });

  it("POLICY_RULE_ERROR omits measured/threshold (they have no meaning for this code)", () => {
    const pack = definePolicyPack({
      name: "t/x",
      version: "0",
      rules: [
        () => {
          throw new Error("nope");
        },
      ],
    });
    const err = lintWithPolicies(rt, [pack]).find((w) => w.code === "POLICY_RULE_ERROR");
    expect(err).toBeDefined();
    expect(err?.measured).toBeUndefined();
    expect(err?.threshold).toBeUndefined();
  });
});

describe("warning() — measured/threshold are optional", () => {
  it("omits both fields when neither is supplied", () => {
    const w = warning("ACME_DRIFT", "primary drifted", ["pm.color.action.primary.rest"]);
    expect(w.measured).toBeUndefined();
    expect(w.threshold).toBeUndefined();
  });

  it("carries both fields when supplied", () => {
    const w = warning("ACME_FLOOR", "below floor", ["pm.x"], 1.2, 4.5);
    expect(w.measured).toBe(1.2);
    expect(w.threshold).toBe(4.5);
  });

  it("carries only `measured` when only it is supplied", () => {
    const w = warning("ACME_X", "msg", [], 0.4);
    expect(w.measured).toBe(0.4);
    expect(w.threshold).toBeUndefined();
  });
});

describe("filterWarnings — CI gating helper", () => {
  it("isolates a subset by code predicate", () => {
    const rt = resolveTheme(aurora, "light");
    const all = lintWithPolicies(rt, [
      definePolicyPack({
        name: "test/gate",
        version: "0.0.0",
        rules: [() => [warning("BANK_CRITICAL", "must fix")]],
      }),
    ]);
    const critical = filterWarnings(all, (code) =>
      code.startsWith("PROTECTED_") || code === "BANK_CRITICAL",
    );
    expect(critical.some((w) => w.code === "BANK_CRITICAL")).toBe(true);
    expect(critical.every((w) => w.code.startsWith("PROTECTED_") || w.code === "BANK_CRITICAL")).toBe(true);
  });
});

describe("Realistic pack — locale-specific large-text floor", () => {
  // Demonstrates a fully shaped pack the docs page references. The rule asserts
  // `pm.typography.body.fontSize` ≥ 18px for orgs targeting older readership; not part of
  // the contract because it's locale / FI-specific.
  const localeLargeText = definePolicyPack({
    name: "bank/locale-large-text",
    version: "1.0.0",
    description: "Large-text floor for the EU+65 readership variant.",
    rules: [
      (rt) => {
        const body = rt.tokens["pm.typography.body"];
        if (!body || body.$type !== "typography") return [];
        const tv = body.value as { fontSize?: { value: number; unit: string } };
        const fs = tv.fontSize;
        if (!fs || fs.unit !== "px") return [];
        if (fs.value < 18) {
          return [
            warning(
              "BANK_LARGE_TEXT_FLOOR",
              `pm.typography.body.fontSize is ${fs.value}px, below the 18px large-text floor`,
              ["pm.typography.body"],
              fs.value,
              18,
            ),
          ];
        }
        return [];
      },
    ],
  });

  const rt = resolveTheme(aurora, "light");
  const all = lintWithPolicies(rt, [localeLargeText]);

  it("fires on Aurora's 16px body", () => {
    expect(all.find((w) => w.code === "BANK_LARGE_TEXT_FLOOR")).toBeDefined();
  });

  it("carries the offending token id in tokenIds", () => {
    const w = all.find((x) => x.code === "BANK_LARGE_TEXT_FLOOR")!;
    expect(w.tokenIds).toContain("pm.typography.body");
  });

  it("does not duplicate built-in warning codes", () => {
    const allBuiltinCodes = all
      .filter((w) => w.code !== "BANK_LARGE_TEXT_FLOOR" && w.code !== "POLICY_RULE_ERROR")
      .map((w) => w.code);
    // Every code in this subset must already exist in the built-in lint pass.
    const builtinOnly = lintWithPolicies(rt);
    const builtinCodes = new Set(builtinOnly.map((w) => w.code));
    for (const code of allBuiltinCodes) {
      expect(builtinCodes.has(code)).toBe(true);
    }
  });
});

describe("lintAllModesWithPolicies — symmetry with lintAllModes", () => {
  const pack = definePolicyPack({
    name: "test/per-mode",
    version: "0",
    rules: [(rt) => [warning("MARK_MODE", `seen in ${rt.mode}`, [], 0, 0)]],
  });

  it("returns one entry per declared mode", () => {
    const result = lintAllModesWithPolicies(aurora, [pack]);
    const modes = result.map((r) => r.mode);
    expect(modes).toContain("light");
    expect(modes).toContain("dark");
  });

  it("each entry's warnings include the pack's emit + the built-in set", () => {
    const result = lintAllModesWithPolicies(aurora, [pack]);
    for (const { warnings } of result) {
      // Pack rule fires under every mode.
      expect(warnings.some((w) => w.code === "MARK_MODE")).toBe(true);
      // Built-in warnings also present (aurora has known advisory warnings under both modes).
      expect(warnings.some((w) => w.code !== "MARK_MODE")).toBe(true);
    }
  });

  it("works with an empty pack array (≡ lintAllModes)", () => {
    const result = lintAllModesWithPolicies(aurora);
    expect(result.length).toBeGreaterThan(0);
    for (const { warnings } of result) {
      expect(warnings.every((w) => w.code !== "MARK_MODE")).toBe(true);
    }
  });
});
