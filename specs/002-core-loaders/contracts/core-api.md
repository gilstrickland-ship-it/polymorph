# Contract: `@polymorph/core` API

```ts
import type { ResolvedTheme, ThemeMode } from "@polymorph/spec";

// --- validation --------------------------------------------------------------
export type ValidationErrorCode = "SCHEMA_INVALID" | "ALIAS_UNRESOLVED" | "ALIAS_CYCLE";
export interface ValidationError { code: ValidationErrorCode; message: string; path?: string; tokenId?: string }
export interface ValidationResult { valid: boolean; errors: ValidationError[] }

/** Schema (Ajv 2020 against @polymorph/spec) + graph checks (dangling alias, cycle). Never throws. */
export function validateTheme(theme: unknown): ValidationResult;

// --- resolution --------------------------------------------------------------
export class ResolveError extends Error { code: "MODE_NOT_DECLARED" | "ALIAS_UNRESOLVED" | "ALIAS_CYCLE" }

/** Resolve a *validated* theme for a mode (default "light") → neutral ResolvedTheme. */
export function resolveTheme(theme: unknown, mode?: ThemeMode): ResolvedTheme;

/** Modes a theme declares (from pm.modes.*). */
export function declaredModes(theme: unknown): ThemeMode[];

// --- advisory a11y lint ------------------------------------------------------
export type LintCode =
  | "CONTRAST_TEXT_LOW" | "CONTRAST_ON_ACTION_LOW"
  | "TOUCH_TARGET_SMALL" | "DISABLED_OPACITY_HIGH" | "CONTRAST_SKIPPED_UNPARSEABLE";
export interface LintWarning { code: LintCode; message: string; tokenIds: string[]; measured: number; threshold: number }

/** Advisory only — returns warnings, never throws, never blocks. */
export function lintTheme(resolved: ResolvedTheme): LintWarning[];

// --- pure helper (exported for testing) --------------------------------------
/** WCAG 2.1 contrast ratio for two sRGB colors; throws if a color is unparseable. */
export function contrastRatio(a: string, b: string): number;
```

## Behaviors

- `validateTheme`: returns `{ valid:false, errors }` (does not throw) for any defect; schema
  errors carry JSON `path`; alias errors carry `tokenId` + the bad/cycle path.
- `resolveTheme`: assumes validity; `ResolvedTheme.tokens` has no remaining `{aliases}`; keys are
  `pm.*` only; `components[role][prop]` = override else resolved `defaultsFrom`.
- `lintTheme`: thresholds — text 4.5:1, on-action 4.5:1, touch target ≥ 44px, disabled opacity ≤
  0.6; unparseable colors → `CONTRAST_SKIPPED_UNPARSEABLE` (informational), never a failure.
