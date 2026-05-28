// @polymorph/adapter-web-solid — Solid 1.x binding for the web adapter.
//
// Re-exports the framework-agnostic core from @polymorph/adapter-web (CSS vars, ThemeBridge,
// retrofit) and layers a Solid ThemeProvider + composables + themed primitives on top. Source
// uses `solid-js/h` (hyperscript) so the build stays tsc-only — no Solid JSX/babel transform.

export * from "./types.js";
export { ThemeProvider, ThemeContext } from "./provider.js";
export { useTheme, useThemeBridge, useResolvedTheme, useSlot, useThemedComponent } from "./composables.js";
export { Screen, Card, Stack, ThemedText, PrimaryButton } from "./primitives.js";

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
