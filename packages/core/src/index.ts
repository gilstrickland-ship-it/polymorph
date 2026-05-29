// @polymorph/core — the resolution core: validate → advisory lint → resolve → ResolvedTheme.
// Operates purely on @polymorph/spec ids; emits the neutral ResolvedTheme. No Node-only APIs.

export { validateTheme } from "./validate.js";
export { resolveTheme, declaredModes } from "./resolve.js";
export { lintTheme, lintAllModes } from "./lint.js";
export {
  definePolicyPack,
  lintWithPolicies,
  lintAllModesWithPolicies,
  filterWarnings,
  warning,
  type PolicyPack,
  type PolicyRule,
} from "./policy-packs.js";
export { applyReducedMotion } from "./reduced-motion.js";
export { contrastRatio, parseColor } from "./contrast.js";
export { ResolveError } from "./errors.js";
export type {
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
  LintWarning,
  LintCode,
  CustomLintCode,
} from "./errors.js";
