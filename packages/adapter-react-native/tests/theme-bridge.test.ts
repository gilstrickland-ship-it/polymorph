import { describe, it, expect } from "vitest";
import { createBridge } from "../src/theme-bridge.js";
import { makeResolved } from "./helpers.js";

describe("ThemeBridge", () => {
  const bridge = createBridge(makeResolved("light"));

  it("reads colors, dimensions, and typography", () => {
    expect(typeof bridge.color("pm.color.surface.base")).toBe("string");
    expect(typeof bridge.dim("pm.space.md")).toBe("number");
    const typo = bridge.typography("pm.typography.body");
    expect(typeof typo.fontSize).toBe("number");
  });

  it("reports presence of optional vs required tokens", () => {
    expect(bridge.has("pm.radius.control")).toBe(true);
    expect(bridge.has("pm.radius.pill")).toBe(false); // optional, absent in fixture
  });

  it("throws a clear error for an absent token", () => {
    expect(() => bridge.color("pm.radius.pill")).toThrow(/missing token/);
  });
});
