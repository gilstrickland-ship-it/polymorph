import { describe, it, expect } from "vitest";
import type { ComponentType } from "react";
import { resolveSlot } from "../src/slots.js";
import { resolveComponent } from "../src/component-map.js";
import { toTokenMap } from "../src/retrofit.js";
import { makeResolved } from "./helpers.js";

const Fallback: ComponentType<unknown> = () => null;
const Override: ComponentType<unknown> = () => null;

describe("render slots", () => {
  it("returns the default when no override is registered", () => {
    expect(resolveSlot({}, "PrimaryButton", Fallback)).toBe(Fallback);
  });
  it("returns the host override when registered", () => {
    expect(resolveSlot({ PrimaryButton: Override }, "PrimaryButton", Fallback)).toBe(Override);
  });
});

describe("component-mapping registry", () => {
  it("falls back to the themed default, or uses a mapped component", () => {
    expect(resolveComponent({}, "button.primary", Fallback)).toBe(Fallback);
    expect(resolveComponent({ "button.primary": Override }, "button.primary", Fallback)).toBe(Override);
  });
});

describe("retrofit shim", () => {
  it("flattens to a pm.* → value map (no aliases, pm-only keys)", () => {
    const map = toTokenMap(makeResolved("light"));
    const keys = Object.keys(map);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((k) => k.startsWith("pm."))).toBe(true);
    expect(typeof map["pm.color.surface.base"]).toBe("string");
  });
});
