# Contract: `@polymorph/loaders` API

```ts
import type { ResolvedTheme, ThemeMode } from "@polymorph/spec";
import type { LintWarning, ValidationError } from "@polymorph/core";

export interface LoadedTheme {
  readonly modes: ThemeMode[];
  readonly contractVersion: string;
  resolve(mode?: ThemeMode): ResolvedTheme;   // throws ResolveError on undeclared mode
  lint(mode?: ThemeMode): LintWarning[];        // advisory
}

export interface ThemeLoader {
  load(): Promise<LoadedTheme>;
}

// Reference loaders
export class InlineLoader implements ThemeLoader { constructor(theme: object); }
export class BundledLoader implements ThemeLoader { constructor(theme: object); }
export class RemoteManifestLoader implements ThemeLoader {
  constructor(opts: { url: string; fetch?: typeof fetch; cacheTtlMs?: number });
}

// Typed errors
export class ThemeValidationError extends Error { errors: ValidationError[]; }
export class LoaderFetchError extends Error { status?: number; }
export class LoaderParseError extends Error {}
```

## Behaviors

- `load()` validates exactly once. On invalid theme it rejects with `ThemeValidationError`
  carrying `ValidationError[]` — a loader never returns an invalid theme (FR-010).
- `LoadedTheme.resolve(mode)` is synchronous and memoized per mode; resolving all three loaders
  for the same theme + mode yields **deep-equal** `ResolvedTheme` (FR-012 / SC-004).
- `RemoteManifestLoader`: single fetch via injected/global `fetch`; caches the validated theme in
  memory (optional TTL). Errors: `LoaderFetchError` (network / non-2xx), `LoaderParseError`
  (malformed JSON), `ThemeValidationError` (schema/graph). No integrity/signature in v1.
- `InlineLoader` vs `BundledLoader`: behaviorally identical resolution; distinct types express
  delivery intent (runtime-supplied vs build-time-bundled).
