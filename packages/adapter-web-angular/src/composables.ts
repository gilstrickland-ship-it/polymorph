import { inject, type Type } from "@angular/core";
import type { ResolvedTheme, ComponentRole } from "@polymorph/spec";
import type { ThemeBridge } from "@polymorph/adapter-web";
import { THEME_TOKEN } from "./context.js";
import type { SlotName, ThemeContextValue } from "./types.js";

/**
 * Returns an accessor for the current theme context. Call it inside templates
 * (`{{ theme().bridge.color('pm.color.surface.base') }}`) or `computed()` for reactivity.
 * Throws synchronously when called outside a `<polymorph-theme-provider>`.
 */
export function injectTheme(): () => ThemeContextValue {
  const sig = inject(THEME_TOKEN, { optional: true });
  if (!sig) throw new Error("injectTheme must be called within a <polymorph-theme-provider>");
  return () => {
    const v = sig();
    if (!v) throw new Error("polymorph-theme-provider is not yet initialized");
    return v;
  };
}

export const injectThemeBridge = (): (() => ThemeBridge) => {
  const t = injectTheme();
  return () => t().bridge;
};

export const injectResolvedTheme = (): (() => ResolvedTheme) => {
  const t = injectTheme();
  return () => t().theme;
};

export function injectSlot(name: SlotName, fallback: Type<unknown>): () => Type<unknown> {
  const t = injectTheme();
  return () => t().slots[name] ?? fallback;
}

export function injectThemedComponent(role: ComponentRole, fallback: Type<unknown>): () => Type<unknown> {
  const t = injectTheme();
  return () => t().components[role] ?? fallback;
}
