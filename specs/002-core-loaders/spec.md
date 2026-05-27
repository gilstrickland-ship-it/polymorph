# Feature Specification: Core + Loaders

**Spec ID**: 002-core-loaders

**Created**: 2026-05-27

**Status**: Draft (awaiting review)

**Input**: Spec B from the approved Polymorph plan — the runtime that acts on the contract:
the resolution **core** (validate → advisory a11y lint → resolve aliases → select mode → emit
`ResolvedTheme`), the pluggable **`ThemeLoader`** abstraction with three reference loaders
(Inline / RemoteManifest / Bundled), and the **`polymorph` CLI** (`validate` / `lint` /
`resolve`). Depends on `@polymorph/spec` (the contract); consumed by the React Native adapter
(Spec C).

---

## Overview

`@polymorph/spec` defines *what* a valid theme is. Spec B builds *what acts on it*:

- **`@polymorph/core`** — turns an authored DTCG theme file into the neutral `ResolvedTheme`
  that SDKs/adapters consume: it validates (JSON Schema + graph rules the schema cannot express),
  runs an **advisory** a11y linter, resolves aliases (with cycle detection), selects a mode, and
  flattens to `ResolvedTheme`.
- **`@polymorph/loaders`** — one `ThemeLoader` interface and three reference implementations so
  the *delivery* of a theme is pluggable without changing the SDK.
- **`@polymorph/cli`** — a thin command-line surface over core for authors and CI.

This spec implements the behaviors `@polymorph/spec` only *declared* (FR-013/014/015 there): the
located-error validation semantics, alias resolution, and the `ResolvedTheme` shape.

---

## Clarifications

### Session 2026-05-27

- Q: Contrast standard for the linter? → A: **WCAG 2.1 contrast ratios** (4.5:1 body text, 3:1
  large/UI text). De-facto compliance reference; easy to explain in advisory output.
- Q: `ThemeLoader` return shape? → A: **`load()` returns a handle** exposing `resolve(mode)` and
  the available modes — fetch/validate once, resolve any mode (incl. runtime light/dark switching)
  without reloading.
- Q: RemoteManifest scope in v1? → A: **validate + cache only**; signing/integrity is deferred
  (roadmap), not in v1.
- Q: CLI argument parsing? → A: **zero-dependency** hand-rolled parsing over `process.argv`.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Validate a theme with located errors (Priority: P1)

A theme author or CI runs validation on a `*.tokens.json` file. A complete, well-formed theme
passes; a malformed one fails with precise, located errors (which token id / JSON path, which
rule), including errors the JSON Schema cannot express (unresolvable alias, alias cycle).

**Why this priority**: Validation is the gate that makes "one SDK, N banks" safe. Resolution and
everything downstream assume a valid theme.

**Independent Test**: Run `validateTheme(theme)` (and `polymorph validate <file>`) over the
contract's fixtures — valid passes; each invalid fixture yields a located error; a dangling alias
and an alias cycle (which the schema cannot catch) are reported by core.

**Acceptance Scenarios**:

1. **Given** a schema-valid theme with all aliases resolvable, **When** validated, **Then** the
   result is `{ valid: true, errors: [] }`.
2. **Given** a theme with an alias to a non-existent token, **When** validated, **Then** it fails
   with an error naming the offending token id and the missing reference.
3. **Given** a theme with an alias cycle (`a → b → a`), **When** validated, **Then** it fails and
   reports the cycle path.
4. **Given** a schema-invalid theme (missing required / type mismatch / unknown `pm` id), **When**
   validated, **Then** the schema errors are surfaced with their JSON paths.

---

### User Story 2 — Resolve a theme to `ResolvedTheme` for a mode (Priority: P1)

Given a valid theme and a selected mode, core produces the flat, neutral `ResolvedTheme`:
aliases resolved to concrete values, the requested mode's mode-sensitive values chosen,
mode-invariant tokens included, and component overrides resolved (falling back to their
`defaultsFrom` semantic token when not overridden).

**Why this priority**: `ResolvedTheme` is the artifact every adapter/SDK consumes. Without it the
framework produces nothing renderable.

**Independent Test**: Resolve a `light+dark` fixture for each mode; assert a mode-sensitive token
differs per mode, a mode-invariant token is identical, an aliased value equals its primitive's
concrete value, and a non-overridden component property equals its `defaultsFrom` token value.

**Acceptance Scenarios**:

1. **Given** a valid theme and `mode = "dark"`, **When** resolved, **Then** every required token
   is present with a concrete value and no `{alias}` remains.
2. **Given** a default (no mode) request, **When** resolved, **Then** `light` is used.
3. **Given** a component override is absent, **When** resolved, **Then** `components[role][prop]`
   equals the value of its `defaultsFrom` semantic token; when present, it equals the override.
4. **Given** an unknown requested mode, **When** resolved, **Then** it errors (the theme does not
   declare that mode).

---

### User Story 3 — Advisory accessibility lint (Priority: P2)

Core inspects a resolved theme and emits **advisory** warnings (never errors): insufficient text
contrast (per a defined standard), text-on-action contrast, touch targets below the minimum, and
a too-high disabled opacity. Warnings are loud and located but never block (Constitution
Principle VI).

**Why this priority**: A11y is a first-class concern, but advisory by decision — the host owns
compliance. P2 because validation/resolution (P1) must exist first.

**Independent Test**: Lint a theme with an intentionally low-contrast `pm.color.text.body` on
`pm.color.surface.base`; a warning is produced naming both tokens and the measured ratio; linting
never changes the exit success of validation.

**Acceptance Scenarios**:

1. **Given** a theme whose body-text/surface contrast is below threshold, **When** linted,
   **Then** a warning names both token ids and the computed contrast.
2. **Given** a touch-target token below the minimum, **When** linted, **Then** a warning is
   produced.
3. **Given** any lint warnings, **When** validation runs, **Then** validation still succeeds
   (lint is non-blocking).

---

### User Story 4 — Load a theme via a pluggable loader (Priority: P2)

A host obtains a validated, resolved theme through a `ThemeLoader` without knowing the delivery
mechanism. Three reference loaders exist: **Inline** (object passed at init), **RemoteManifest**
(fetch a versioned JSON over HTTP, validate, cache), **Bundled** (a build-time-compiled theme
package). The same theme delivered by any loader yields an identical `ResolvedTheme`.

**Why this priority**: The pluggable abstraction is a core thesis (theme updates without app
release, etc.). P2 because Inline alone suffices for the demo; the abstraction must still be
proven across all three.

**Independent Test**: Load one Borealis-like theme via Inline, RemoteManifest (against a local
fixture server / mocked fetch), and Bundled; assert all three produce a deep-equal
`ResolvedTheme` for the same mode.

**Acceptance Scenarios**:

1. **Given** any of the three loaders configured with the same theme, **When** loaded and
   resolved for a mode, **Then** the `ResolvedTheme` is deep-equal across loaders.
2. **Given** a RemoteManifest loader and a transient fetch failure, **When** load is retried,
   **Then** it surfaces a typed loader error (and uses cache if available).
3. **Given** an invalid theme from any loader, **When** loaded, **Then** validation errors are
   surfaced (loaders never return an invalid theme).

---

### User Story 5 — CLI for authors and CI (Priority: P3)

`polymorph validate|lint|resolve <file>` provides a thin CLI: `validate` exits non-zero on
invalid themes with located errors; `lint` prints advisory warnings and exits zero by default
(opt-in `--strict` to fail); `resolve --mode <m>` prints the `ResolvedTheme` JSON to stdout.

**Why this priority**: Ergonomics/CI integration. P3 because the library API (US1/US2) delivers
the value; the CLI wraps it.

**Independent Test**: Run each subcommand over fixtures; assert exit codes (validate: 1 on
invalid, 0 on valid; lint: 0 with warnings, 1 with `--strict`; resolve: prints valid JSON).

**Acceptance Scenarios**:

1. **Given** an invalid theme, **When** `polymorph validate`, **Then** exit code is non-zero and
   errors are printed.
2. **Given** a valid theme, **When** `polymorph resolve --mode dark`, **Then** valid
   `ResolvedTheme` JSON is printed and exit code is zero.
3. **Given** lint warnings, **When** `polymorph lint`, **Then** exit code is zero; with
   `--strict`, non-zero.

---

### Edge Cases

- **Dangling alias / cycle**: caught by core (not the schema); cycle error includes the path.
- **Alias chains**: `a → b → concrete` resolves transitively to the concrete value.
- **Mode not declared**: resolving an undeclared mode errors; resolving the default uses `light`.
- **Lint never blocks**: warnings do not affect `validate` success or `resolve` output.
- **Remote loader**: network failure, non-200, malformed JSON, and schema-invalid remote theme
  each produce a typed loader error; a successful prior fetch may be served from cache.
- **Component fallback**: a non-overridden component property resolves to its `defaultsFrom`
  value; an overridden one to the override.
- **Contrast on non-color tokens**: the linter only evaluates rules it has defined inputs for;
  missing optional tokens are skipped, not warned as errors.

---

## Requirements *(mandatory)*

### Functional — validation (core)

- **FR-001**: `@polymorph/core` MUST validate a theme against the `@polymorph/spec`
  `theme.schema.json` (JSON Schema 2020-12 via Ajv) and surface schema errors with their JSON
  path / token id.
- **FR-002**: Core MUST perform graph checks the schema cannot express: every alias resolves to
  an existing token (**dangling-alias** error), and alias references contain no **cycles** (error
  reports the cycle path).
- **FR-003**: Validation MUST return a typed result `{ valid: boolean, errors: ValidationError[] }`
  where each error has a `code`, human message, and `path`/`tokenId` (FR-015 of Spec A).

### Functional — resolution (core)

- **FR-004**: Given a valid theme and a mode, core MUST produce a `ResolvedTheme` (per
  `@polymorph/spec`): aliases resolved transitively to concrete values, the mode's mode-sensitive
  values selected, mode-invariant tokens included, **no aliases remaining**, keys `pm.*` only.
- **FR-005**: Resolution MUST resolve component tokens: `components[role][property]` = the
  override if present, else the resolved value of the property's `defaultsFrom` semantic token.
- **FR-006**: The default mode is `light` (Spec A FR-011). Requesting an undeclared mode is an
  error.

### Functional — advisory a11y lint (core)

- **FR-007**: Core MUST provide an **advisory** linter over a resolved theme: it returns
  `LintWarning[]` and MUST NOT throw or fail validation (Constitution Principle VI).
- **FR-008**: The v0 ruleset MUST include: text contrast (`pm.color.text.body` vs
  `pm.color.surface.base`, and `pm.color.text.onAction` vs `pm.color.action.primary.rest`),
  minimum touch target (`pm.size.touchTarget.min`), and disabled opacity sanity
  (`pm.opacity.disabled`). Each warning names the token id(s), the measured value, and the
  threshold.
- **FR-009**: Contrast MUST be computed by a single, documented standard (see Clarifications).

### Functional — loaders

- **FR-010**: `@polymorph/loaders` MUST define one `ThemeLoader` interface whose `load()` returns
  a **handle** over an already-validated theme, exposing `resolve(mode)` and the list of available
  modes (fetch/validate once, resolve any mode without reloading). A loader MUST NOT return an
  invalid theme (it surfaces validation errors instead).
- **FR-011**: Three reference loaders MUST exist: `InlineLoader` (theme object at init),
  `RemoteManifestLoader` (HTTP fetch of a versioned JSON; validate; **cache**; injectable `fetch`
  for testing), and `BundledLoader` (a build-time-bundled theme module/object).
- **FR-012**: The same theme delivered by any loader MUST yield a deep-equal `ResolvedTheme` for a
  given mode (SC: loader equivalence).
- **FR-013**: `RemoteManifestLoader` MUST surface typed errors for network failure, non-success
  status, malformed JSON, and schema-invalid payloads; integrity/signature verification is
  **deferred** unless decided otherwise in Clarifications.

### Functional — CLI

- **FR-014**: `polymorph validate <file>` MUST exit non-zero on an invalid theme and print located
  errors; zero on valid.
- **FR-015**: `polymorph lint <file>` MUST print advisory warnings and exit zero by default;
  `--strict` makes warnings fail (non-zero).
- **FR-016**: `polymorph resolve <file> --mode <mode>` MUST print the `ResolvedTheme` JSON to
  stdout and exit zero for a valid theme.

### Key Entities

- **ValidationError**: `{ code, message, path?, tokenId? }`.
- **ValidationResult**: `{ valid, errors }`.
- **LintWarning**: `{ code, message, tokenIds, measured, threshold }`.
- **ThemeLoader**: interface producing a validated, resolved theme (per mode).
- **ResolvedTheme**: defined by `@polymorph/spec` (this spec produces it; does not redefine it).

---

## Success Criteria *(mandatory)*

- **SC-001**: Core validates all `@polymorph/spec` valid fixtures as valid and every invalid
  fixture as invalid with a located error; additionally catches a dangling-alias and a cycle
  fixture the schema cannot.
- **SC-002**: For a `light+dark` theme, resolving each mode yields a `ResolvedTheme` with all
  required tokens concrete (no aliases), mode-sensitive values differing per mode, mode-invariant
  values identical, and component fallbacks correct.
- **SC-003**: The linter flags an intentionally low-contrast theme with a located, advisory
  warning and never changes validation success (Principle VI proven).
- **SC-004**: The same theme via Inline, RemoteManifest (mocked fetch), and Bundled produces a
  deep-equal `ResolvedTheme`.
- **SC-005**: `polymorph validate` returns exit 1 on an invalid theme and 0 on a valid one;
  `resolve --mode dark` prints parseable `ResolvedTheme` JSON.

---

## Assumptions

- `@polymorph/spec` (Spec A) is stable and provides the schema, manifest, and `ResolvedTheme`
  types; core depends on it.
- Runtime is TypeScript/ESM on Node ≥ 20 and React Native's JS runtime (no Node-only APIs in core
  beyond what RN polyfills; the CLI may use Node APIs).
- `transform` (Style Dictionary, build-time native artifacts) is **out of scope for v1**; the CLI
  may expose a stub that reports "not yet implemented".
- Remote loader signing/governance is deferred (roadmap); v1 does validate + cache.

---

## Resolved Decisions

All open questions resolved in **Clarifications (Session 2026-05-27)** and folded into the
requirements: WCAG 2.1 contrast (FR-009), `load()`→handle (FR-010), RemoteManifest validate+cache
only (FR-013), zero-dependency CLI (FR-014–016). No items deferred to planning.
