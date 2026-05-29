export type ValidationErrorCode = "SCHEMA_INVALID" | "ALIAS_UNRESOLVED" | "ALIAS_CYCLE";

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  /** JSON pointer (schema errors) or dotted token path (graph errors). */
  path?: string;
  /** The pm.* token id when applicable. */
  tokenId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export type LintCode =
  | "CONTRAST_TEXT_LOW"
  | "CONTRAST_ON_ACTION_LOW"
  | "CONTRAST_ON_INVERSE_LOW"
  | "CONTRAST_FEEDBACK_LOW"
  | "DISABLED_TEXT_LOW"
  | "FOCUS_RING_LOW"
  | "BORDER_DEFAULT_LOW"
  | "COMPONENT_CONTRAST_LOW"
  | "TOUCH_TARGET_SMALL"
  | "DISABLED_OPACITY_HIGH"
  | "MOTION_BASE_LONG"
  | "MOTION_REDUCED_EXCEEDS_SHORT"
  | "PROTECTED_CONTRAST_LOW"
  | "PROTECTED_FONT_SIZE_SMALL"
  | "PROTECTED_LINE_HEIGHT_TIGHT"
  | "POLICY_RULE_ERROR"
  | "CONTRAST_SKIPPED_UNPARSEABLE";

/**
 * A `LintCode` value emitted by a built-in rule (the union below) OR a project-local
 * policy pack (any other string). Built-in rule code points are exhaustively listed for
 * TypeScript narrowing; FI-supplied codes pass through as plain strings — a string literal
 * that doesn't match the built-in union is just as valid at runtime, and the
 * `definePolicyPack` helper accepts any code shape.
 */
export type CustomLintCode = string & { __pmCustomLintCode?: never };

/**
 * Advisory only — never thrown, never blocks (Constitution Principle VI). `measured` /
 * `threshold` are optional: many policy-pack codes (and `POLICY_RULE_ERROR`) don't carry
 * a numeric pair. Built-in rules that DO measure a value still emit both for the lint
 * panel's "X above Y" presentation.
 */
export interface LintWarning {
  code: LintCode | CustomLintCode;
  message: string;
  tokenIds: string[];
  measured?: number;
  threshold?: number;
}

export class ResolveError extends Error {
  code: "MODE_NOT_DECLARED" | "ALIAS_UNRESOLVED" | "ALIAS_CYCLE";
  constructor(code: ResolveError["code"], message: string) {
    super(message);
    this.name = "ResolveError";
    this.code = code;
  }
}
