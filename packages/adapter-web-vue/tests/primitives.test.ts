import { describe, it, expect } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { ThemeProvider, ThemedText, PrimaryButton } from "../src/index.js";
import { makeResolved } from "./helpers.js";

const rt = makeResolved("light");

const inProvider = (child: () => unknown) =>
  mount(ThemeProvider, { props: { theme: rt }, slots: { default: child } });

describe("themed primitives", () => {
  it("ThemedText renders the requested tag and inline-styles via var(--…)", () => {
    const w = inProvider(() => h(ThemedText, { variant: "heading" }, () => "Open your account"));
    const h2 = w.find("h2");
    expect(h2.exists()).toBe(true);
    expect(h2.text()).toBe("Open your account");
    const style = h2.attributes("style") ?? "";
    expect(style).toContain("var(--pm-typography-heading-font-family)");
    expect(style).toContain("var(--pm-color-text-body)");
  });

  it("ThemedText muted variant uses the muted color token", () => {
    const w = inProvider(() => h(ThemedText, { variant: "caption", muted: true }, () => "fine print"));
    const style = w.find("small").attributes("style") ?? "";
    expect(style).toContain("var(--pm-color-text-muted)");
  });

  it("PrimaryButton emits `press` on click and renders disabled state", async () => {
    let pressed = false;
    const Host = defineComponent({
      setup: () =>
        () =>
          h(PrimaryButton, { label: "Continue", onPress: () => (pressed = true) }),
    });

    const w = inProvider(() => h(Host));
    const btn = w.find("button");
    await btn.trigger("click");
    expect(pressed).toBe(true);

    const w2 = inProvider(() => h(PrimaryButton, { label: "x", disabled: true }));
    const dStyle = w2.find("button").attributes("style") ?? "";
    expect(dStyle).toContain("var(--pm-color-action-primary-disabled)");
    expect(w2.find("button").attributes("disabled")).toBeDefined();
  });
});
