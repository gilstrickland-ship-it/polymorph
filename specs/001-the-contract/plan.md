# Implementation Plan: The Contract

**Branch**: `001-the-contract` (developed on `claude/compassionate-gauss-tLBN4`) | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-the-contract/spec.md`

> Spec Kit feature resolution: this feature lives at `specs/001-the-contract/` on a shared
> branch. Run all Spec Kit scripts with `SPECIFY_FEATURE=001-the-contract` so they resolve this
> directory rather than the git branch name.

## Summary

Define and ship the **Polymorph theme contract** as the `@polymorph/spec` package: a DTCG
(2025.10 stable) -based token format extended with three thin, documented conventions — a
reserved `pm.*` namespace, parallel per-mode token sets, and an optional component-token layer —
plus the **v0 semantic vocabulary** (the finite, purpose-named token set SDKs code against), a
machine-readable **JSON Schema** for validation, a machine-readable **vocabulary manifest**, and
generated **TypeScript types** (including the framework/component-model-neutral `ResolvedTheme`
shape). This package is data + rules only; the resolver/linter/CLI (Spec B) and adapters (Spec C)
consume it. Success = two visually distinct mock-bank themes validate with no schema change, and
the vocabulary can express the onboarding UI with zero primitive references.

## Technical Context

**Language/Version**: TypeScript 5.7 (ESM), Node ≥ 20. Primary artifacts are also language-neutral
JSON (JSON Schema + vocabulary manifest + example `.tokens.json` themes).

**Primary Dependencies**: W3C DTCG **2025.10 stable** as the base token format; **JSON Schema
2020-12** dialect for the theme schema. The validation *engine* (Ajv) lives in `@polymorph/core`
(Spec B); `@polymorph/spec` ships the schema + manifest + types and has **zero runtime
dependencies**. Build-time: `tsc`.

**Storage**: N/A. Files only: `theme.tokens.json` (FI themes), `theme.schema.json`,
`semantic-vocabulary.v0.json`.

**Testing**: Vitest. Fixture-driven: a complete valid theme validates; one fixture per Edge Case
category fails with a located error; manifest ↔ schema consistency; `ResolvedTheme`/ID types
stay in sync with the manifest.

**Target Platform**: Platform-neutral. The schema is consumable by non-TS toolchains; the TS
types serve web + React Native now and Flutter/native (via Style Dictionary) later.

**Project Type**: Monorepo library — the `@polymorph/spec` package (already scaffolded).

**Performance Goals**: N/A for the artifacts themselves. (Resolver target — validate a typical
theme in < 50 ms — belongs to Spec B/core.)

**Constraints**: Conventions MUST be additive over DTCG (Principle II); the schema MUST be a
standalone artifact (Principle IV neutrality); `@polymorph/spec` keeps zero runtime deps so any
SDK/toolchain can depend on it cheaply.

**Scale/Scope**: v0 ≈ 70 semantic tokens (≈ 40 required / 30 optional), 7 component roles, 3
theme modes (`light` required; `dark`/`highContrast` optional).

## Constitution Check

*GATE: Must pass before Phase 0. Re-checked after Phase 1.* Against constitution v1.1.0.

| Principle | Gate | Status |
|---|---|---|
| I. Contract-First | Spec defines the **semantic layer** as the only SDK surface; primitives are non-contract; namespace prevents leakage | PASS — `pm.*` semantic IDs are the surface; FI primitives live outside `pm.*` |
| II. Standards-Based, Minimally Extended | Base format is DTCG 2025.10; only documented conventions added; DTCG wins on conflict | PASS — 3 conventions (namespace, per-mode sets, component layer) documented as extensions in `contracts/dtcg-extensions.md` |
| III. Stable, Versioned Vocabulary | Vocabulary is finite, purpose-named, versioned; additions-only is the safe path | PASS — manifest carries a contract version; FR-016/017 encode versioning |
| IV. Data + Thin Adapter / Neutral Output | `ResolvedTheme` output is framework/component-model-neutral | PASS — `ResolvedTheme` is a plain `Record<semanticId, value>`; shape defined here, produced in Spec B |
| V. Hybrid Rendering With Escape Hatches | Component tokens optional; closed role set; not a component framework | PASS — component layer optional (FR-008), closed v0 role set (Appendix B) |
| VI. Advisory A11y (loud) | Contract enables strong advisory checks without enforcement | PASS — provides `pm.size.touchTarget.min` + color roles the linter checks; contract never blocks |
| VII. Conformance-Gated | Contract supplies fixtures for the conformance suite | PASS — valid + per-edge-case fixtures authored here, reused by Spec E |

**Result**: No violations. Complexity Tracking left empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-the-contract/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    ├── README.md
    ├── dtcg-extensions.md          # the 3 conventions over DTCG
    ├── semantic-vocabulary.v0.json # machine-readable token manifest (the heart of the contract)
    └── resolved-theme.contract.md  # neutral ResolvedTheme output shape
```

### Source Code (repository root)

```text
packages/spec/
├── schema/
│   ├── theme.schema.json          # JSON Schema 2020-12 for a full theme file (built from manifest + conventions)
│   └── dtcg-types.schema.json     # the DTCG 2025.10 $type subset Polymorph accepts
├── manifest/
│   └── semantic-vocabulary.v0.json # canonical token manifest (id, $type, required, mode-sensitive, group)
├── src/
│   ├── index.ts                   # public exports + SPEC_VERSION
│   ├── types.ts                   # SemanticTokenId, ThemeMode, ResolvedTheme, ComponentRole, ...
│   ├── vocabulary.ts              # typed accessors over the manifest (required set, types, roles)
│   └── version.ts                 # contract semantic version + compatibility helpers
├── docs/                          # authored contract reference (vocabulary + conventions + versioning)
└── tests/
    ├── fixtures/
    │   ├── valid/                 # complete light-only + light+dark themes (Aurora/Borealis seeds)
    │   └── invalid/               # one per Edge Case: missing-required, dangling-alias, cycle,
    │                              #   type-mismatch, partial-mode, partial-composite, pm-collision
    ├── schema.test.ts             # fixtures validate / fail with located errors
    ├── manifest.test.ts           # manifest ↔ schema ↔ types consistency
    └── versioning.test.ts         # additive = compatible; rename/remove = breaking
```

**Structure Decision**: Single monorepo library package `packages/spec` (already scaffolded with
`package.json`, `tsconfig.json`, `src/index.ts`). The contract is split into three consumable
artifacts — `schema/` (validation), `manifest/` (the token vocabulary as data), `src/` (TS
types) — so non-TS toolchains can use the schema/manifest directly while TS consumers get types.
Test fixtures double as the seed corpus the conformance suite (Spec E) reuses.

## Complexity Tracking

> No constitution violations — section intentionally empty.
