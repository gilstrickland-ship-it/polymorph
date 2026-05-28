import { describe, it, expect } from "vitest";
import * as React from "react";
import type { ComponentType } from "react";
import TestRenderer from "react-test-renderer";
import { ThemeProvider, useTheme, useSlot, useResolvedTheme } from "../src/provider.js";
import { makeResolved } from "./helpers.js";

const rt = makeResolved("light");
const Fallback: ComponentType<unknown> = () => null;
const Override: ComponentType<unknown> = () => null;

describe("ThemeProvider / useTheme", () => {
  it("provides the resolved theme + bridge and injects a <style> block scoped to its wrapper", () => {
    let captured: ReturnType<typeof useTheme> | undefined;
    function Probe(): null {
      captured = useTheme();
      return null;
    }
    let tree: TestRenderer.ReactTestRenderer | undefined;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        React.createElement(ThemeProvider, { theme: rt }, React.createElement(Probe)),
      );
    });
    // Bridge is wired
    expect(captured!.theme).toBe(rt);
    expect(captured!.bridge.color("pm.color.surface.base")).toBe("var(--pm-color-surface-base)");

    // <style> contains the resolved CSS variables, scoped to the provider's wrapper class.
    const json = tree!.toJSON();
    const node = Array.isArray(json) ? json[0] : json;
    expect(node).toBeTruthy();
    const styleEl = findChild(node!, "style");
    expect(styleEl, "<style> element").toBeTruthy();
    const css = (styleEl!.children ?? []).join("");
    expect(css).toMatch(/\.pm-theme-\S+ \{/);
    expect(css).toMatch(/--pm-color-surface-base: \S+;/);
  });

  it("useSlot returns the host override when provided, else the default", () => {
    let withOverride: ComponentType<unknown> | undefined;
    let withoutOverride: ComponentType<unknown> | undefined;
    function A(): null {
      withOverride = useSlot("PrimaryButton", Fallback);
      return null;
    }
    function B(): null {
      withoutOverride = useSlot("PrimaryButton", Fallback);
      return null;
    }
    TestRenderer.act(() => {
      TestRenderer.create(
        React.createElement(
          ThemeProvider,
          { theme: rt, slots: { PrimaryButton: Override } },
          React.createElement(A),
        ),
      );
    });
    TestRenderer.act(() => {
      TestRenderer.create(React.createElement(ThemeProvider, { theme: rt }, React.createElement(B)));
    });
    expect(withOverride).toBe(Override);
    expect(withoutOverride).toBe(Fallback);
  });

  it("useTheme throws outside a provider", () => {
    function Bare(): null {
      useResolvedTheme();
      return null;
    }
    expect(() =>
      TestRenderer.act(() => {
        TestRenderer.create(React.createElement(Bare));
      }),
    ).toThrow(/ThemeProvider/);
  });
});

// --- helper: walk react-test-renderer JSON to find a node by type --------------------------------

type Node = { type: string; props: Record<string, unknown>; children: (Node | string)[] | null };
function findChild(root: Node, type: string): Node | null {
  if (root.type === type) return root;
  for (const c of root.children ?? []) {
    if (typeof c === "object" && c !== null) {
      const m = findChild(c, type);
      if (m) return m;
    }
  }
  return null;
}
