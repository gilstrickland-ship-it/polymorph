import { describe, it, expect } from "vitest";
import { validateTheme } from "../src/validate.js";
import { specFixture, coreFixture } from "./helpers.js";

describe("validateTheme — schema (reusing @polymorph/spec fixtures)", () => {
  it("accepts valid fixtures", () => {
    for (const name of ["minimal-light", "with-components", "light-dark"]) {
      const r = validateTheme(specFixture("valid", name));
      expect(r.valid, JSON.stringify(r.errors)).toBe(true);
    }
  });

  it("rejects each invalid fixture with a located SCHEMA_INVALID error", () => {
    for (const name of ["missing-required", "type-mismatch", "pm-collision", "unknown-pm-id", "unknown-role", "partial-dark"]) {
      const r = validateTheme(specFixture("invalid", name));
      expect(r.valid, name).toBe(false);
      expect(r.errors.some((e) => e.code === "SCHEMA_INVALID" && (e.path ?? "").length > 0), name).toBe(true);
    }
  });
});

describe("validateTheme — graph checks the schema cannot express", () => {
  it("reports a dangling alias with the offending token id", () => {
    const r = validateTheme(coreFixture("dangling-alias"));
    expect(r.valid).toBe(false);
    const e = r.errors.find((x) => x.code === "ALIAS_UNRESOLVED");
    expect(e).toBeTruthy();
    expect(e!.tokenId).toContain("pm.modes.light.color.text.body");
  });

  it("reports an alias cycle with the cycle path", () => {
    const r = validateTheme(coreFixture("alias-cycle"));
    expect(r.valid).toBe(false);
    const e = r.errors.find((x) => x.code === "ALIAS_CYCLE");
    expect(e).toBeTruthy();
    expect(e!.message).toContain("→");
  });
});
