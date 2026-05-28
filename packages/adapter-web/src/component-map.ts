import type { ComponentType } from "react";
import type { ComponentRole } from "@polymorph/spec";

export type ComponentRegistry = Partial<Record<ComponentRole, ComponentType<unknown>>>;

export function resolveComponent<P>(
  registry: ComponentRegistry,
  role: ComponentRole,
  fallback: ComponentType<P>,
): ComponentType<P> {
  return (registry[role] as ComponentType<P> | undefined) ?? fallback;
}
