import type { ComponentType } from "react";

/** Named host override points the SDK exposes (mirrors the React Native adapter's set). */
export type SlotName = "Header" | "PrimaryButton" | "Field" | "StepIndicator" | "Disclosure";

export type SlotComponents = Partial<Record<SlotName, ComponentType<unknown>>>;

export function resolveSlot<P>(
  slots: SlotComponents,
  name: SlotName,
  fallback: ComponentType<P>,
): ComponentType<P> {
  return (slots[name] as ComponentType<P> | undefined) ?? fallback;
}
