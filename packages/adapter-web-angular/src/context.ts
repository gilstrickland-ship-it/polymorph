import { InjectionToken } from "@angular/core";
import type { ThemeStore } from "./types.js";

/**
 * DI token for the per-`<polymorph-theme-provider>` theme store. Each provider's component-scoped
 * injector creates its own `WritableSignal<ThemeContextValue | null>`; descendants reading the
 * token get the right value for their position in the tree (so nested providers work).
 */
export const THEME_TOKEN = new InjectionToken<ThemeStore>("polymorph-theme");
