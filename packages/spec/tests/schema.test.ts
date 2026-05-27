import { describe, it, expect } from "vitest";
import { makeValidate, loadFixture, errorsToString } from "./helpers.js";

describe("theme schema — valid fixtures (US2)", () => {
  const validate = makeValidate();
  for (const name of ["minimal-light", "with-components", "light-dark"]) {
    it(`accepts ${name}`, () => {
      const ok = validate(loadFixture("valid", name));
      expect(ok, errorsToString(validate)).toBe(true);
    });
  }
});

describe("theme schema — invalid fixtures fail with a located error (US2, SC-003)", () => {
  const validate = makeValidate();

  it("missing required token names the missing id", () => {
    expect(validate(loadFixture("invalid", "missing-required"))).toBe(false);
    expect(errorsToString(validate)).toContain('"missingProperty":"body"');
  });

  it("type mismatch points at the offending token path", () => {
    expect(validate(loadFixture("invalid", "type-mismatch"))).toBe(false);
    expect(errorsToString(validate)).toContain("/pm/modes/light/color/surface/base");
  });

  it("FI token smuggled under pm is rejected (pm collision)", () => {
    expect(validate(loadFixture("invalid", "pm-collision"))).toBe(false);
    expect(errorsToString(validate)).toContain('"additionalProperty":"palette"');
  });

  it("unknown pm.* id is rejected and named", () => {
    expect(validate(loadFixture("invalid", "unknown-pm-id"))).toBe(false);
    expect(errorsToString(validate)).toContain('"additionalProperty":"bogus"');
  });
});
