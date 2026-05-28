import { describe, it, expect, afterEach } from "vitest";
import { createSignal, type Component } from "solid-js";
import { render } from "solid-js/web";
import h from "solid-js/h";
import { ThemeProvider, useTheme, useSlot, useResolvedTheme } from "../src/index.js";
import { makeResolved } from "./helpers.js";

const rt = makeResolved("light");

const Fallback: Component = () => h("span") as unknown as ReturnType<Component>;
const Override: Component = () => h("span") as unknown as ReturnType<Component>;

const mounts: Array<() => void> = [];
afterEach(() => {
  while (mounts.length) mounts.pop()?.();
  document.body.innerHTML = "";
});

function mount(tree: () => unknown): HTMLDivElement {
  const root = document.createElement("div");
  document.body.appendChild(root);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispose = render(() => tree() as any, root);
  mounts.push(dispose);
  return root;
}

describe("ThemeProvider / useTheme", () => {
  it("provides theme + bridge + scope and injects a scoped <style>", () => {
    let captured: ReturnType<typeof useTheme> | undefined;
    const Probe: Component = () => {
      captured = useTheme();
      return h("span", { "data-color": captured.bridge.color("pm.color.surface.base") }) as unknown as ReturnType<Component>;
    };

    const root = mount(() => h(ThemeProvider, { theme: rt, get children() { return h(Probe); } }));

    expect(captured!.theme).toBe(rt);
    expect(captured!.bridge.color("pm.color.surface.base")).toBe("var(--pm-color-surface-base)");

    const probeSpan = root.querySelector("[data-color]") as HTMLElement;
    expect(probeSpan.getAttribute("data-color")).toBe("var(--pm-color-surface-base)");

    const styleEl = root.querySelector("style") as HTMLStyleElement;
    expect(styleEl).toBeTruthy();
    const scope = styleEl.getAttribute("data-polymorph-theme")!;
    expect(scope).toMatch(/^pm-theme-/);
    const css = styleEl.textContent ?? "";
    expect(css).toMatch(new RegExp(`\\.${scope} \\{`));
    expect(css).toMatch(/--pm-color-surface-base: \S+;/);
    expect(css).toMatch(/--pm-typography-body-font-size:/);
  });

  it("re-emits CSS variables when `theme` changes (fine-grained reactivity)", () => {
    const tinyTheme = (color: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({
        contractVersion: "0.0.0",
        mode: "light" as const,
        tokens: { "pm.color.surface.base": { $type: "color", value: color } },
        components: {},
      }) as any;

    const [theme, setTheme] = createSignal(tinyTheme("#ffffff"));
    const root = mount(() =>
      h(ThemeProvider, { get theme() { return theme(); }, get children() { return "ok"; } }),
    );
    const beforeCss = root.querySelector("style")!.textContent ?? "";
    expect(beforeCss).toContain("#ffffff");

    setTheme(tinyTheme("#0b1320"));
    const afterCss = root.querySelector("style")!.textContent ?? "";
    expect(afterCss).toContain("#0b1320");
    expect(afterCss).not.toBe(beforeCss);
  });

  it("useSlot returns the host override when registered, else the default", () => {
    let withOverride: Component | undefined;
    let withoutOverride: Component | undefined;
    const ProbeA: Component = () => {
      withOverride = useSlot("PrimaryButton", Fallback);
      return h("span") as unknown as ReturnType<Component>;
    };
    const ProbeB: Component = () => {
      withoutOverride = useSlot("PrimaryButton", Fallback);
      return h("span") as unknown as ReturnType<Component>;
    };

    mount(() =>
      h(ThemeProvider, {
        theme: rt,
        slots: { PrimaryButton: Override },
        get children() {
          return h(ProbeA);
        },
      }),
    );
    mount(() =>
      h(ThemeProvider, { theme: rt, get children() { return h(ProbeB); } }),
    );

    expect(withOverride).toBe(Override);
    expect(withoutOverride).toBe(Fallback);
  });

  it("useTheme throws outside a provider", () => {
    const Bare: Component = () => {
      useResolvedTheme();
      return h("span") as unknown as ReturnType<Component>;
    };
    expect(() => mount(() => h(Bare))).toThrow(/ThemeProvider/);
  });
});
