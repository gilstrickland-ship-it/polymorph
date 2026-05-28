import { describe, it, expect, afterEach } from "vitest";
import { render } from "solid-js/web";
import h from "solid-js/h";
import { ThemeProvider, ThemedText, PrimaryButton } from "../src/index.js";
import { makeResolved } from "./helpers.js";

const rt = makeResolved("light");

const mounts: Array<() => void> = [];
afterEach(() => {
  while (mounts.length) mounts.pop()?.();
  document.body.innerHTML = "";
});

function mountInProvider(child: () => unknown): HTMLDivElement {
  const root = document.createElement("div");
  document.body.appendChild(root);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispose = render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => h(ThemeProvider, { theme: rt, get children() { return child() as any; } }) as any,
    root,
  );
  mounts.push(dispose);
  return root;
}

describe("themed primitives", () => {
  it("ThemedText renders the requested tag and inline-styles via var(--…)", () => {
    const root = mountInProvider(() => h(ThemedText, { variant: "heading" }, "Open your account"));
    const h2 = root.querySelector("h2") as HTMLElement;
    expect(h2).toBeTruthy();
    expect(h2.textContent).toBe("Open your account");
    const style = h2.getAttribute("style") ?? "";
    expect(style).toContain("var(--pm-typography-heading-font-family)");
    expect(style).toContain("var(--pm-color-text-body)");
  });

  it("ThemedText muted variant uses the muted color token", () => {
    const root = mountInProvider(() => h(ThemedText, { variant: "caption", muted: true }, "fine print"));
    const small = root.querySelector("small") as HTMLElement;
    const style = small.getAttribute("style") ?? "";
    expect(style).toContain("var(--pm-color-text-muted)");
  });

  it("PrimaryButton fires onPress on click and renders the disabled state", () => {
    let pressed = false;
    // Solid's `h()` promotes zero-arg function props on components to reactive accessors. Write
    // event-like callbacks with at least one parameter (the Solid convention) and Solid leaves
    // them as plain functions.
    const root = mountInProvider(() =>
      h(PrimaryButton, { label: "Continue", onPress: (_e?: unknown) => (pressed = true) }),
    );
    const btn = root.querySelector("button") as HTMLButtonElement;
    btn.dispatchEvent(new Event("click", { bubbles: true }));
    expect(pressed).toBe(true);

    const root2 = mountInProvider(() => h(PrimaryButton, { label: "x", disabled: true }));
    const btn2 = root2.querySelector("button") as HTMLButtonElement;
    expect(btn2.disabled).toBe(true);
    expect(btn2.getAttribute("style") ?? "").toContain("var(--pm-color-action-primary-disabled)");
  });
});
