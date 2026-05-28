# Implementation Plan: Core + Loaders

**Branch**: `002-core-loaders` (developed on `claude/compassionate-gauss-tLBN4`) | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-core-loaders/spec.md`

> Run Spec Kit scripts with `SPECIFY_FEATURE=002-core-loaders`.

## Summary

Implement the runtime that acts on the contract, across three packages:

- **`@polymorph/core`** — `validateTheme` (Ajv 2020 against `@polymorph/spec` schema + graph
  checks: dangling alias, alias cycle), `resolveTheme(theme, mode)` → neutral `ResolvedTheme`
  (transitive alias resolution, mode selection, component `defaultsFrom` fallback), and an
  **advisory** `lintTheme` (WCAG 2.1 contrast, touch-target, disabled-opacity; warnings only).
- **`@polymorph/loaders`** — one `ThemeLoader` whose `load()` returns a **handle** with
  `resolve(mode)` + `modes`; reference loaders `InlineLoader`, `RemoteManifestLoader` (injectable
  `fetch`, validate + cache), `BundledLoader`.
- **`@polymorph/cli`** — zero-dependency `polymorph validate | lint | resolve`.

Acceptance: core validates over the Spec A fixtures + new alias/cycle fixtures; the same theme via
all three loaders deep-equals; the linter flags low contrast without blocking; the CLI exit codes
behave.

## Technical Context

**Language/Version**: TypeScript 5.7 (ESM), Node ≥ 20; core stays RN-runtime-safe (no Node-only
APIs); CLI may use Node APIs (`node:fs`, `node:process`).

**Primary Dependencies**: `@polymorph/spec` (workspace). `@polymorph/core` depends on **Ajv 8**
(`ajv/dist/2020`) + `ajv-formats`. `loaders` and `cli` depend on `core` + `spec`; **zero
third-party deps** beyond that (no CLI arg library). Dev: vitest, tsx, @types/node.

**Storage**: N/A. RemoteManifest cache is in-memory (per loader instance).

**Testing**: Vitest. Reuse `@polymorph/spec` fixtures; add alias/cycle + low-contrast fixtures in
`core`. RemoteManifest uses an injected `fetch` stub.

**Target Platform**: Platform-neutral library (web + RN); CLI is Node.

**Project Type**: Monorepo libraries (`packages/core`, `packages/loaders`, `packages/cli`).

**Performance Goals**: Resolve a typical theme in < 50 ms (validate + resolve) on Node; asserted
loosely, not a hard gate.

**Constraints**: `core` must not import Node-only modules (RN can use it); contrast math is pure;
loaders keep cache in-memory; CLI zero-dep.

**Scale/Scope**: ~68-token themes, 3 modes, 7 component roles; small inputs.

## Constitution Check

*GATE: re-checked post-design.* Against constitution v1.1.0.

| Principle | Status |
|---|---|
| I. Contract-First | PASS — core operates purely on `@polymorph/spec` ids; `ResolvedTheme` keys are `pm.*` only |
| II. Standards-Based | PASS — validation is JSON Schema 2020-12; no new token format |
| III. Versioned vocabulary | PASS — core reads the manifest/schema from `@polymorph/spec`; defines no vocabulary |
| IV. Data + thin adapter / neutral output | PASS — core emits the neutral `ResolvedTheme`; no framework coupling |
| V. Hybrid rendering | PASS — component resolution honors optional overrides + `defaultsFrom` |
| VI. Advisory a11y (loud) | PASS — `lintTheme` returns warnings only, never throws/blocks; CLI `lint` exits 0 unless `--strict` |
| VII. Conformance-gated | PASS — fixtures (incl. loader-equivalence) feed Spec E |

**Result**: No violations. Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-core-loaders/
├── plan.md, research.md, data-model.md, quickstart.md
└── contracts/
    ├── core-api.md     # validateTheme / resolveTheme / lintTheme signatures + error/warning codes
    └── loader-api.md   # ThemeLoader interface + handle + the three loaders
```

### Source Code (repository root)

```text
packages/core/
├── src/
│   ├── index.ts
│   ├── validate.ts      # Ajv schema validate + graph checks (dangling alias, cycle)
│   ├── resolve.ts       # alias resolution, mode selection, component fallback → ResolvedTheme
│   ├── lint.ts          # advisory WCAG 2.1 contrast + touch-target + opacity rules
│   ├── contrast.ts      # pure sRGB relative-luminance + ratio
│   ├── errors.ts        # ValidationError / LintWarning codes + types
│   └── internal/walk.ts # DTCG tree helpers (collect tokens, follow {aliases})
└── tests/               # validate / resolve / lint / contrast unit + fixtures

packages/loaders/
├── src/{index,theme-loader,inline,remote-manifest,bundled}.ts
└── tests/               # loader-equivalence + remote fetch/cache/error

packages/cli/
├── src/{index.ts,cli.ts}  # arg parsing + validate/lint/resolve subcommands
└── tests/                 # exit-code + output behavior (invoke run() in-process)
```

**Structure Decision**: Three already-scaffolded packages. `core` is the engine; `loaders` and
`cli` are thin layers over it. `core/src/contrast.ts` is isolated and pure for easy unit testing.
Fixtures from `@polymorph/spec/tests/fixtures` are reused; alias/cycle/low-contrast fixtures are
added under `packages/core/tests/fixtures`.

## Complexity Tracking

> No constitution violations — section intentionally empty.
