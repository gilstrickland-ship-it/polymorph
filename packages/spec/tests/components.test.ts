import { describe, it, expect } from "vitest";
import { makeValidate, loadFixture, errorsToString } from "./helpers.js";

describe("component tokens (US3)", () => {
  const validate = makeValidate();

  it("a theme with no component tokens validates (layer is optional)", () => {
    expect(validate(loadFixture("valid", "minimal-light")), errorsToString(validate)).toBe(true);
  });

  it("valid component overrides validate", () => {
    expect(validate(loadFixture("valid", "with-components")), errorsToString(validate)).toBe(true);
  });

  it("an unknown component role/variant is rejected and named", () => {
    expect(validate(loadFixture("invalid", "unknown-role"))).toBe(false);
    expect(errorsToString(validate)).toContain('"additionalProperty":"tertiary"');
  });
});
