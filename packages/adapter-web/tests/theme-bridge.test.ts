import { describe, it, expect } from "vitest";
import { createBridge } from "../src/theme-bridge.js";
import { makeResolved } from "./helpers.js";

describe("Web ThemeBridge (returns CSS var() references)", () => {
  const bridge = createBridge(makeResolved("light"));

  it("color/dim/num return `var(--…)` strings", () => {
    expect(bridge.color("pm.color.surface.base")).toBe("var(--pm-color-surface-base)");
    expect(bridge.dim("pm.space.md")).toBe("var(--pm-space-md)");
  });

  it("typography returns sub-property var refs ready to spread into style", () => {
    const t = bridge.typography("pm.typography.body");
    expect(t.fontFamily).toBe("var(--pm-typography-body-font-family)");
    expect(t.fontSize).toBe("var(--pm-typography-body-font-size)");
    expect(t.fontWeight).toBe("var(--pm-typography-body-font-weight)");
    expect(t.lineHeight).toBe("var(--pm-typography-body-line-height)");
    expect(t.letterSpacing).toBe("var(--pm-typography-body-letter-spacing)");
  });

  it("has() reports presence; missing tokens throw with a clear message", () => {
    expect(bridge.has("pm.radius.control")).toBe(true);
    expect(bridge.has("pm.radius.pill")).toBe(false);
    expect(() => bridge.color("pm.radius.pill")).toThrow(/missing token/);
  });
});
