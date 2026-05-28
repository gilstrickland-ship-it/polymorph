import type { ComponentType } from "react";

/** Named override points the SDK exposes; host may inject its own component. */
export type SlotName = "Header" | "PrimaryButton" | "Field" | "StepIndicator" | "Disclosure";

export type SlotComponents = Partial<Record<SlotName, ComponentType<unknown>>>;

/** Return the host override for a slot if present, else the SDK's default component. */
export function resolveSlot<P>(
  slots: SlotComponents,
  name: SlotName,
  fallback: ComponentType<P>,
): ComponentType<P> {
  return (slots[name] as ComponentType<P> | undefined) ?? fallback;
}
