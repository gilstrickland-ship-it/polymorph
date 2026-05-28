import type { ComponentType } from "react";
import type { ComponentRole } from "@polymorph/spec";

/** Optional, role-based mapping of SDK component roles → host component-library entries. */
export type ComponentRegistry = Partial<Record<ComponentRole, ComponentType<unknown>>>;

/** Return the host-mapped component for a role if registered, else the themed SDK default. */
export function resolveComponent<P>(
  registry: ComponentRegistry,
  role: ComponentRole,
  fallback: ComponentType<P>,
): ComponentType<P> {
  return (registry[role] as ComponentType<P> | undefined) ?? fallback;
}
