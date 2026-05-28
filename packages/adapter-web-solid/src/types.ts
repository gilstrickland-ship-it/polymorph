import type { Component } from "solid-js";
import type { ResolvedTheme, ComponentRole } from "@polymorph/spec";
import type { ThemeBridge } from "@polymorph/adapter-web";

/** Named host override points (mirrors the other adapters). */
export type SlotName = "Header" | "PrimaryButton" | "Field" | "StepIndicator" | "Disclosure";

export type SlotComponents = Partial<Record<SlotName, Component>>;
export type ComponentRegistry = Partial<Record<ComponentRole, Component>>;

export interface ThemeContextValue {
  readonly theme: ResolvedTheme;
  readonly bridge: ThemeBridge;
  readonly slots: SlotComponents;
  readonly components: ComponentRegistry;
  /** The CSS class the provider applies to its wrapper element. */
  readonly scope: string;
}
