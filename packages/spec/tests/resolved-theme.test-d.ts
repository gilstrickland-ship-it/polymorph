// Compile-time test: ResolvedTheme is neutral, plain data (US6, Principle IV).
import type { ResolvedTheme, ThemeMode } from "../src/index.js";

export const sample: ResolvedTheme = {
  contractVersion: "0.0.0",
  mode: "light",
  tokens: { "pm.color.text.body": { $type: "color", value: "#000000" } },
  components: { "button.primary": { radius: { value: 8, unit: "px" } } },
};

// @ts-expect-error — mode must be one of the contract modes
export const badMode: ThemeMode = "sepia";

// Neutral: spreads into a plain record with no branded/framework types.
export const asPlain: Record<string, unknown> = { ...sample };
