import { describe, it, expect } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { ThemeProvider, useTheme, useSlot, useResolvedTheme } from "../src/index.js";
import { makeResolved } from "./helpers.js";

const rt = makeResolved("light");

const Fallback = defineComponent({ name: "Fallback", render: () => h("span") });
const Override = defineComponent({ name: "Override", render: () => h("span") });

describe("ThemeProvider / useTheme", () => {
  it("provides theme + bridge + scope and injects a scoped <style>", () => {
    const Probe = defineComponent({
      setup() {
        const ctx = useTheme();
        return () =>
          h("div", {
            "data-color": ctx.bridge.color("pm.color.surface.base"),
            "data-scope": ctx.scope,
          });
      },
    });

    const wrapper = mount(ThemeProvider, {
      props: { theme: rt },
      slots: { default: () => h(Probe) },
    });

    expect(wrapper.find("[data-color]").attributes("data-color")).toBe("var(--pm-color-surface-base)");
    const scope = wrapper.find("[data-scope]").attributes("data-scope");
    expect(scope).toMatch(/^pm-theme-/);

    const styleEl = wrapper.find("style");
    expect(styleEl.exists()).toBe(true);
    expect(styleEl.attributes("data-polymorph-theme")).toBe(scope);
    const css = styleEl.text();
    expect(css).toMatch(new RegExp(`\\.${scope} \\{`));
    expect(css).toMatch(/--pm-color-surface-base: \S+;/);
    expect(css).toMatch(/--pm-typography-body-font-size:/);
  });

  it("re-emits CSS variables when `theme` changes", async () => {
    // Tiny inline themes with different colors — the shared light-dark spec fixture uses the
    // same placeholder for both modes, so swapping it wouldn't observably change the CSS.
    const tinyTheme = (color: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({
        contractVersion: "0.0.0",
        mode: "light" as const,
        tokens: { "pm.color.surface.base": { $type: "color", value: color } },
        components: {},
      }) as any;

    const wrapper = mount(ThemeProvider, {
      props: { theme: tinyTheme("#ffffff") },
      slots: { default: () => "ok" },
    });
    const before = wrapper.find("style").text();
    expect(before).toContain("#ffffff");
    await wrapper.setProps({ theme: tinyTheme("#0b1320") });
    const after = wrapper.find("style").text();
    expect(after).toContain("#0b1320");
    expect(after).not.toBe(before);
  });

  it("useSlot returns the host override when registered, else the default", () => {
    let withOverride: unknown;
    let withoutOverride: unknown;
    const ProbeA = defineComponent({
      setup() {
        withOverride = useSlot("PrimaryButton", Fallback);
        return () => h("span");
      },
    });
    const ProbeB = defineComponent({
      setup() {
        withoutOverride = useSlot("PrimaryButton", Fallback);
        return () => h("span");
      },
    });

    mount(ThemeProvider, {
      props: { theme: rt, slots: { PrimaryButton: Override } },
      slots: { default: () => h(ProbeA) },
    });
    mount(ThemeProvider, {
      props: { theme: rt },
      slots: { default: () => h(ProbeB) },
    });

    expect(withOverride).toBe(Override);
    expect(withoutOverride).toBe(Fallback);
  });

  it("useTheme throws outside a provider", () => {
    const Bare = defineComponent({
      setup() {
        useResolvedTheme();
        return () => h("span");
      },
    });
    expect(() => mount(Bare)).toThrow(/ThemeProvider/);
  });
});
