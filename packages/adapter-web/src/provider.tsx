import {
  createContext,
  useContext,
  useMemo,
  useId,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";
import type { ResolvedTheme, ComponentRole } from "@polymorph/spec";
import { createBridge, type ThemeBridge } from "./theme-bridge.js";
import { toCssVariablesString } from "./css-vars.js";
import { resolveSlot, type SlotComponents, type SlotName } from "./slots.js";
import { resolveComponent, type ComponentRegistry } from "./component-map.js";

export interface ThemeContextValue {
  theme: ResolvedTheme;
  bridge: ThemeBridge;
  slots: SlotComponents;
  components: ComponentRegistry;
  /** The CSS class the provider applies to its wrapper (useful for portals). */
  scope: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** A resolved theme (from @polymorph/core or a loader handle). */
  theme: ResolvedTheme;
  /** Host render-slot overrides. */
  slots?: SlotComponents;
  /** Host role→component mappings. */
  components?: ComponentRegistry;
  /** Custom scope class. Default: a unique per-instance class. */
  scope?: string;
  children?: ReactNode;
}

/**
 * Injects the resolved theme's CSS variables scoped to a wrapper element and provides context
 * with the bridge, slot registry, and component registry. Switching `theme` updates the injected
 * stylesheet — children don't remount, and styles cascade through `var(--…)` references.
 */
export function ThemeProvider(props: ThemeProviderProps): ReactElement {
  const { theme, slots, components, scope, children } = props;
  const generated = useId().replace(/:/g, "");
  const cls = scope ?? `pm-theme-${generated}`;
  const css = useMemo(() => toCssVariablesString(theme, `.${cls}`), [theme, cls]);
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      bridge: createBridge(theme),
      slots: slots ?? {},
      components: components ?? {},
      scope: cls,
    }),
    [theme, slots, components, cls],
  );
  return (
    <ThemeContext.Provider value={value}>
      <style data-polymorph-theme={cls}>{css}</style>
      <div className={cls}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const v = useContext(ThemeContext);
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
