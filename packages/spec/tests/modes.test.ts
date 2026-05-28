import { describe, it, expect } from "vitest";
import { makeValidate, loadFixture, errorsToString } from "./helpers.js";

describe("theme modes (US4)", () => {
  const validate = makeValidate();

  it("light-only theme validates (light is the default mode)", () => {
    expect(validate(loadFixture("valid", "minimal-light")), errorsToString(validate)).toBe(true);
  });

  it("light + dark theme validates", () => {
    expect(validate(loadFixture("valid", "light-dark")), errorsToString(validate)).toBe(true);
  });

  it("a dark mode missing a required mode-sensitive token fails, naming it for that mode", () => {
    expect(validate(loadFixture("invalid", "partial-dark"))).toBe(false);
    const errs = errorsToString(validate);
    expect(errs).toContain("/pm/modes/dark/color/text");
    expect(errs).toContain('"missingProperty":"body"');
  });
});
