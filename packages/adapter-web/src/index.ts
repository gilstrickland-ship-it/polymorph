// @polymorph/adapter-web — CSS-vars + React adapter.
//
// Framework-agnostic core (toCssVariables, toCssVariablesString, ThemeBridge, slot + component
// registries, retrofit) imports only @polymorph/spec types. The React binding (ThemeProvider +
// hooks + themed primitives) layers on top and is the only consumer of `react`.

export * from "./css-vars.js";
export * from "./theme-bridge.js";
export * from "./slots.js";
export * from "./component-map.js";
export * from "./retrofit.js";
export * from "./provider.js";
export * from "./primitives.js";
