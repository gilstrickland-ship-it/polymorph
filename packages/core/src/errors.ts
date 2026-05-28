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
  | "CONTRAST_SKIPPED_UNPARSEABLE";

/** Advisory only — never thrown, never blocks (Constitution Principle VI). */
export interface LintWarning {
  code: LintCode;
  message: string;
  tokenIds: string[];
  measured: number;
  threshold: number;
}

export class ResolveError extends Error {
  code: "MODE_NOT_DECLARED" | "ALIAS_UNRESOLVED" | "ALIAS_CYCLE";
  constructor(code: ResolveError["code"], message: string) {
    super(message);
    this.name = "ResolveError";
    this.code = code;
  }
}
