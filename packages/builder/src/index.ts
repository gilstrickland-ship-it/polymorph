// @polymorph/builder — headless React primitives for editing a theme contract.
//
// The package gives an FI's design-system team building blocks for a visual theme editor:
// a stateful hook that owns the working theme + tracks dirtiness + computes lint warnings
// on every edit, a small set of typed token field components, and an unstyled orchestrator.
// Visual chrome is the caller's job — every component emits accessible, class-hooked markup
// that the FI styles to match their existing tooling.
//
// Scope: token-level editing (every `pm.*` id) plus component-property overrides. The
// builder does NOT cover primitive groups (`color.brand.*` etc.) — those belong to a
// design-token tool, not the contract editor.

export {
  useThemeEditor,
  type ThemeEditorState,
  type ThemeEditorActions,
  type ThemeEditorHook,
} from "./use-theme-editor.js";

export { ColorField } from "./fields/color-field.js";
export { DimensionField } from "./fields/dimension-field.js";
export { DurationField } from "./fields/duration-field.js";
export { NumberField } from "./fields/number-field.js";
export { CubicBezierField } from "./fields/cubic-bezier-field.js";
export { TokenField } from "./fields/token-field.js";

export { LintPanel } from "./lint-panel.js";
export { ThemeEditorRoot } from "./theme-editor-root.js";

export type { FieldProps } from "./fields/types.js";
