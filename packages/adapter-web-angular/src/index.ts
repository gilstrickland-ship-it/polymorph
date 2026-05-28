// @polymorph/adapter-web-angular — Angular 18+ binding for the web adapter.
//
// Re-exports the framework-agnostic core from @polymorph/adapter-web (CSS vars, ThemeBridge,
// retrofit) and layers an Angular standalone ThemeProviderComponent + inject() helpers + themed
// primitives on top. Standalone components + signals + tsc-only build — no NgModules required.

export * from "./types.js";
export { THEME_TOKEN } from "./context.js";
export { ThemeProviderComponent } from "./provider.js";
export { injectTheme, injectThemeBridge, injectResolvedTheme, injectSlot, injectThemedComponent } from "./composables.js";
export { ThemedTextComponent, PrimaryButtonComponent } from "./primitives.js";

// Framework-agnostic core re-exports.
export {
  toCssVarName,
  toCssEntries,
  toCssVariables,
  toCssVariablesString,
  createBridge,
  toTokenMap,
  type ThemeBridge,
  type TypographyStyle,
} from "@polymorph/adapter-web";
