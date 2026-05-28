// @polymorph/adapter-web-vue — Vue 3 binding for the web adapter.
//
// Re-exports the framework-agnostic core from @polymorph/adapter-web (CSS vars, ThemeBridge,
// retrofit shim) and layers a Vue ThemeProvider + composables + themed primitives on top.
// Vue 3.4+ is an optional peer dependency.

export * from "./types.js";
export { ThemeProvider, ThemeKey } from "./provider.js";
export { useTheme, useThemeBridge, useResolvedTheme, useSlot, useThemedComponent } from "./composables.js";
export { Screen, Card, Stack, ThemedText, PrimaryButton } from "./primitives.js";

// Framework-agnostic core re-exports — consumers can import them from here for convenience.
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
