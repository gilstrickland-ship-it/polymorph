import { validateTheme, resolveTheme, declaredModes, lintTheme } from "@polymorph/core";
import type { ValidationError, LintWarning } from "@polymorph/core";
import type { ResolvedTheme, ThemeMode } from "@polymorph/spec";

export class ThemeValidationError extends Error {
  errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super(`theme failed validation (${errors.length} error(s))`);
    this.name = "ThemeValidationError";
    this.errors = errors;
  }
}

export class LoaderFetchError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "LoaderFetchError";
    this.status = status;
  }
}

export class LoaderParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoaderParseError";
  }
}

/** A handle over an already-validated theme. Resolve any mode without reloading. */
export interface LoadedTheme {
  readonly modes: ThemeMode[];
  readonly contractVersion: string;
  resolve(mode?: ThemeMode): ResolvedTheme;
  lint(mode?: ThemeMode): LintWarning[];
}

export interface ThemeLoader {
  load(): Promise<LoadedTheme>;
}

/** Validate once, return a handle with memoized per-mode resolution. Throws on invalid theme. */
export function makeLoadedTheme(theme: unknown): LoadedTheme {
  const result = validateTheme(theme);
  if (!result.valid) throw new ThemeValidationError(result.errors);

  const modes = declaredModes(theme);
  const cache = new Map<ThemeMode, ResolvedTheme>();
  const resolve = (mode: ThemeMode = "light"): ResolvedTheme => {
    let r = cache.get(mode);
    if (!r) {
      r = resolveTheme(theme, mode);
      cache.set(mode, r);
    }
    return r;
  };

  return {
    modes,
    contractVersion: resolve("light").contractVersion,
    resolve,
    lint: (mode?: ThemeMode) => lintTheme(resolve(mode)),
  };
}
