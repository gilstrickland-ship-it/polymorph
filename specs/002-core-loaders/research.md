# Phase 0 Research: Core + Loaders

Most decisions were fixed in Clarifications; this records the technical specifics.

## R1 — Schema validation reuse

**Decision**: `@polymorph/core` compiles the `@polymorph/spec` schemas at runtime with **Ajv 8**
(`ajv/dist/2020`) + `ajv-formats`. It imports the three shipped JSON files via the spec package's
exports map (`@polymorph/spec/schema/theme.schema.json`, `.../components.schema.json`,
`.../dtcg-types.schema.json`), `addSchema` the two referenced ones, and `compile` the theme
schema once per `validateTheme` module load.

**Rationale**: Single source of validation (Spec A R6); no schema duplication. Ajv is the same
engine the spec package tests already use.

**Alternatives**: Re-deriving validation in TS (drift risk — rejected).

## R2 — Graph checks beyond JSON Schema

**Decision**: After schema validation passes, core walks the theme tree to:
- **Dangling alias**: every `"$value"` of the form `"{path}"` must resolve to an existing token
  node; otherwise `ALIAS_UNRESOLVED` with the source token id + missing path.
- **Cycle**: following aliases from each token, a revisited node on the current path is a
  `ALIAS_CYCLE` with the path printed (`a → b → a`).

**Rationale**: JSON Schema cannot express reference resolvability or cycles (Spec A FR-013/014).

**Implementation**: DFS with a `visiting` set; alias target lookup by splitting the `{a.b.c}` path
and indexing the parsed theme object.

## R3 — Resolution semantics

**Decision**: `resolveTheme(theme, mode = "light")`:
1. Build a lookup of all token nodes by dotted path.
2. For each manifest semantic id: pick its node from `pm.modes.<mode>` (mode-sensitive) or `pm.*`
   (mode-invariant); resolve its `$value` transitively to a concrete value.
3. Emit `ResolvedTheme.tokens[id] = { $type, value }` (only ids the theme defines; all required
   guaranteed present by validation).
4. For each component role/property: `components[role][prop]` = resolved override if the theme
   defines `pm.<role>.<prop>`, else the resolved value of its `defaultsFrom` semantic token.

**Rationale**: Matches `@polymorph/spec` `ResolvedTheme` + FR-004/005; keeps output neutral.

**Edge**: requesting a mode the theme does not declare → `ResolveError` (`MODE_NOT_DECLARED`).

## R4 — Contrast standard (WCAG 2.1)

**Decision**: Relative luminance per WCAG 2.1; contrast ratio `(L1 + 0.05) / (L2 + 0.05)`.
Thresholds: **4.5:1** for body text, **3:1** for large/UI text. The linter parses **sRGB hex**
(`#rgb`, `#rrggbb`, `#rrggbbaa`) and `rgb()/rgba()`. Colors in other CSS Color 4 forms (`oklch()`,
`color(display-p3 …)`) are **skipped** with an informational `CONTRAST_SKIPPED_UNPARSEABLE`
warning — never a failure (advisory).

**Rationale**: WCAG 2.1 is the de-facto banking compliance reference and trivially explainable.
Full CSS Color 4 parsing is out of scope for an advisory v0; skipping is safe under Principle VI.

**v0 ruleset** (over a `ResolvedTheme`):
- `CONTRAST_TEXT_LOW`: `pm.color.text.body` vs `pm.color.surface.base` < 4.5.
- `CONTRAST_ON_ACTION_LOW`: `pm.color.text.onAction` vs `pm.color.action.primary.rest` < 4.5.
- `TOUCH_TARGET_SMALL`: `pm.size.touchTarget.min` < 44px (WCAG 2.5.5 / 2.1 advisory).
- `DISABLED_OPACITY_HIGH`: `pm.opacity.disabled` > 0.6 (sanity).

**Alternatives**: APCA (draft — rejected per clarify).

## R5 — ThemeLoader handle

**Decision**: 
```ts
interface ThemeLoader { load(): Promise<LoadedTheme>; }
interface LoadedTheme {
  readonly modes: ThemeMode[];
  readonly contractVersion: string;
  resolve(mode?: ThemeMode): ResolvedTheme;   // throws ResolveError on undeclared mode
  lint(mode?: ThemeMode): LintWarning[];       // advisory
}
```
`load()` validates once (throws `ThemeValidationError` carrying `ValidationError[]` on failure)
and returns a handle; `resolve` is synchronous and cheap (resolution memoized per mode).

**Rationale**: Fetch/validate once, switch modes at runtime without reloading (clarify decision);
keeps remote network cost to a single fetch.

## R6 — RemoteManifestLoader

**Decision**: `new RemoteManifestLoader({ url, fetch?, cacheTtlMs? })`. Uses injected `fetch`
(defaults to global `fetch`, Node ≥ 18/20). On `load()`: fetch → assert ok status → parse JSON →
`validateTheme` → cache the validated theme in memory (TTL optional). Typed errors:
`LoaderFetchError` (network/non-200), `LoaderParseError` (bad JSON), `ThemeValidationError`
(schema/graph). Integrity/signature **deferred** (clarify).

**Rationale**: Lean v1; injectable `fetch` makes it testable with no network.

## R7 — CLI (zero-dep)

**Decision**: Hand-rolled parse of `process.argv`: `polymorph <command> <file> [--mode m]
[--strict] [--json]`. `run(argv): Promise<number>` returns an exit code (testable in-process);
the bin wrapper calls `process.exit(await run(...))`. No arg-parsing dependency (clarify).

## Resolved unknowns

All clarify questions resolved; contrast parsing limitation (R4) is documented and advisory-safe.

## Sources

- [WCAG 2.1 — Contrast (Minimum) 1.4.3 & relative luminance](https://www.w3.org/TR/WCAG21/#dfn-relative-luminance)
- [WCAG 2.1 — Target Size 2.5.5](https://www.w3.org/TR/WCAG21/#target-size)
