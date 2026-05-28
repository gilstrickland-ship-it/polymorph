import { createContext, createMemo, createUniqueId, type Component, type JSX } from "solid-js";
import h from "solid-js/h";
import type { ResolvedTheme } from "@polymorph/spec";
import { createBridge, toCssVariablesString } from "@polymorph/adapter-web";
import type { ComponentRegistry, SlotComponents, ThemeContextValue } from "./types.js";

/** The Solid context carrying the theme + bridge + slot/component registries to descendants. */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  theme: ResolvedTheme;
  slots?: SlotComponents;
  components?: ComponentRegistry;
  /** Override the auto-generated wrapper class. */
  scope?: string;
  children?: JSX.Element;
}

/**
 * Injects a scoped `<style>` block with the resolved theme's CSS variables and provides context
 * (theme / bridge / slots / components / scope) to descendants via Solid's `createContext`.
 * Switching the `theme` prop updates the variables (fine-grained reactivity — descendants don't
 * re-render unless they read theme-dependent values directly).
 */
export const ThemeProvider: Component<ThemeProviderProps> = (props) => {
  const uid = createUniqueId();
  const scope = createMemo(() => props.scope || `pm-theme-${uid}`);
  const bridge = createMemo(() => createBridge(props.theme));
  const css = createMemo(() => toCssVariablesString(props.theme, `.${scope()}`));

  // Getter-backed context: reads stay reactive on prop changes (Solid tracks the access).
  const ctx: ThemeContextValue = {
    get theme() {
      return props.theme;
    },
    get bridge() {
      return bridge();
    },
    get slots() {
      return props.slots ?? {};
    },
    get components() {
      return props.components ?? {};
    },
    get scope() {
      return scope();
    },
  };

  // `solid-js/h` returns a callable that resolves to JSX.Element under Solid's reactivity;
  // cast at the boundary so this conforms to `Component<P>`. Runtime is unaffected.
  return h(ThemeContext.Provider, {
    value: ctx,
    get children() {
      return h("div", { class: scope() }, [
        h("style", { "data-polymorph-theme": scope() }, css()),
        props.children,
      ]);
    },
  }) as unknown as JSX.Element;
};
