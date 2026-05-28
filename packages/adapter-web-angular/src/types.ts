import type { Type, WritableSignal } from "@angular/core";
import type { ResolvedTheme, ComponentRole } from "@polymorph/spec";
import type { ThemeBridge } from "@polymorph/adapter-web";

/** Named host override points (mirrors the other adapters). */
export type SlotName = "Header" | "PrimaryButton" | "Field" | "StepIndicator" | "Disclosure";

/** Angular's `Type<unknown>` accepts any component class — same role as React's `ComponentType`. */
export type SlotComponents = Partial<Record<SlotName, Type<unknown>>>;
export type ComponentRegistry = Partial<Record<ComponentRole, Type<unknown>>>;

export interface ThemeContextValue {
  readonly theme: ResolvedTheme;
  readonly bridge: ThemeBridge;
  readonly slots: SlotComponents;
  readonly components: ComponentRegistry;
  /** The CSS class the provider applies to its wrapper element. */
  readonly scope: string;
}

/**
 * Internal: the providers' factory stores a `WritableSignal` so the provider component can
 * update it as @Inputs change, and consumers (via `injectTheme`) read it reactively.
 */
export type ThemeStore = WritableSignal<ThemeContextValue | null>;
