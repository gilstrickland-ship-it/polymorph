import { useContext, type Component } from "solid-js";
import type { ResolvedTheme, ComponentRole } from "@polymorph/spec";
import type { ThemeBridge } from "@polymorph/adapter-web";
import { ThemeContext } from "./provider.js";
import type { SlotName, ThemeContextValue } from "./types.js";

export function useTheme(): ThemeContextValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme must be used within a <ThemeProvider>");
  return v;
}

export const useThemeBridge = (): ThemeBridge => useTheme().bridge;
export const useResolvedTheme = (): ResolvedTheme => useTheme().theme;

export function useSlot(name: SlotName, fallback: Component): Component {
  return useTheme().slots[name] ?? fallback;
}

export function useThemedComponent(role: ComponentRole, fallback: Component): Component {
  return useTheme().components[role] ?? fallback;
}
