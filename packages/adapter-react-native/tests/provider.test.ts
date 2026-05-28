import { describe, it, expect } from "vitest";
import * as React from "react";
import type { ComponentType } from "react";
import TestRenderer from "react-test-renderer";
import { ThemeProvider, useTheme, useSlot } from "../src/provider.js";
import { makeResolved } from "./helpers.js";

const rt = makeResolved("light");
const Fallback: ComponentType<unknown> = () => null;
const Override: ComponentType<unknown> = () => null;

describe("ThemeProvider / useTheme", () => {
  it("provides the resolved theme + a working bridge through context", () => {
    let captured: ReturnType<typeof useTheme> | undefined;
    function Probe(): null {
      captured = useTheme();
      return null;
    }
    TestRenderer.act(() => {
      TestRenderer.create(React.createElement(ThemeProvider, { theme: rt }, React.createElement(Probe)));
    });
    expect(captured!.theme).toBe(rt);
    expect(captured!.bridge.color("pm.color.surface.base")).toBe(
      (rt.tokens["pm.color.surface.base"] as { value: string }).value,
    );
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
        React.createElement(ThemeProvider, { theme: rt, slots: { PrimaryButton: Override } }, React.createElement(A)),
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
      useTheme();
      return null;
    }
    expect(() =>
      TestRenderer.act(() => {
        TestRenderer.create(React.createElement(Bare));
      }),
    ).toThrow(/ThemeProvider/);
  });
});
