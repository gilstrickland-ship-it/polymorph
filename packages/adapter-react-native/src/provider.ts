import * as React from "react";
import type { ComponentType, ReactNode } from "react";
import type { ResolvedTheme, ComponentRole } from "@polymorph/spec";
import { createBridge, type ThemeBridge } from "./theme-bridge.js";
import { resolveSlot, type SlotComponents, type SlotName } from "./slots.js";
import { resolveComponent, type ComponentRegistry } from "./component-map.js";

export interface ThemeContextValue {
  theme: ResolvedTheme;
  bridge: ThemeBridge;
  slots: SlotComponents;
  components: ComponentRegistry;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** A resolved theme (from @polymorph/core or a loader handle's resolve(mode)). */
  theme: ResolvedTheme;
  /** Host render-slot overrides. */
  slots?: SlotComponents;
  /** Host role→component mappings (power feature). */
  components?: ComponentRegistry;
  children?: ReactNode;
}

export function ThemeProvider(props: ThemeProviderProps): React.ReactElement {
  const { theme, slots, components, children } = props;
  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, bridge: createBridge(theme), slots: slots ?? {}, components: components ?? {} }),
    [theme, slots, components],
  );
  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const v = React.useContext(ThemeContext);
  if (!v) throw new Error("useTheme must be used within a <ThemeProvider>");
  return v;
}

export const useThemeBridge = (): ThemeBridge => useTheme().bridge;
export const useResolvedTheme = (): ResolvedTheme => useTheme().theme;

export function useSlot<P>(name: SlotName, fallback: ComponentType<P>): ComponentType<P> {
  return resolveSlot(useTheme().slots, name, fallback);
}

export function useThemedComponent<P>(role: ComponentRole, fallback: ComponentType<P>): ComponentType<P> {
  return resolveComponent(useTheme().components, role, fallback);
}
