# Phase 1 Data Model: Core + Loaders

Types introduced by Spec B. `ResolvedTheme`, `ThemeMode`, `SemanticTokenId`, `ComponentRole` come
from `@polymorph/spec` and are not redefined here.

## ValidationError

`{ code: ValidationErrorCode; message: string; path?: string; tokenId?: string }`

- `code` ∈ `SCHEMA_INVALID` | `ALIAS_UNRESOLVED` | `ALIAS_CYCLE`.
- `path` is a JSON pointer (schema errors) or dotted token path; `tokenId` the `pm.*` id when
  applicable. Every error is located (Spec A FR-015).

## ValidationResult

`{ valid: boolean; errors: ValidationError[] }` — `valid` iff `errors` is empty.

## LintWarning (advisory)

`{ code: LintCode; message: string; tokenIds: string[]; measured: number; threshold: number }`

- `code` ∈ `CONTRAST_TEXT_LOW` | `CONTRAST_ON_ACTION_LOW` | `TOUCH_TARGET_SMALL` |
  `DISABLED_OPACITY_HIGH` | `CONTRAST_SKIPPED_UNPARSEABLE`.
- Never an error; never thrown (Principle VI).

## ResolveError

Thrown by `resolveTheme` / `LoadedTheme.resolve` for unrecoverable cases:
`{ code: "MODE_NOT_DECLARED" | "ALIAS_UNRESOLVED" | "ALIAS_CYCLE"; message }`. (Resolution assumes
a validated theme; these guard misuse.)

## ThemeLoader / LoadedTheme

```ts
interface ThemeLoader { load(): Promise<LoadedTheme>; }

interface LoadedTheme {
  readonly modes: ThemeMode[];
  readonly contractVersion: string;
  resolve(mode?: ThemeMode): ResolvedTheme;
  lint(mode?: ThemeMode): LintWarning[];
}
```

- **InlineLoader**: `new InlineLoader(theme: object)`.
- **RemoteManifestLoader**: `new RemoteManifestLoader({ url, fetch?, cacheTtlMs? })`.
- **BundledLoader**: `new BundledLoader(theme: object)` (semantically a build-time-bundled theme;
  identical resolution to Inline — distinct type for intent/telemetry).

Loader errors: `LoaderFetchError`, `LoaderParseError`, `ThemeValidationError` (wraps
`ValidationError[]`).

## Internal: TokenNode lookup

A parsed theme is walked into `Map<dottedPath, { $type, $value }>` for O(1) alias resolution.
Alias `"{a.b.c}"` → lookup `a.b.c`. Resolution follows aliases with a `visiting` set for cycle
detection.

## Relationships

```text
ThemeFile --validateTheme--> ValidationResult
ThemeFile --resolveTheme(mode)--> ResolvedTheme (@polymorph/spec)
ResolvedTheme --lintTheme--> LintWarning[]
ThemeLoader.load() --> LoadedTheme { resolve(mode)->ResolvedTheme, lint(mode)->LintWarning[] }
```
