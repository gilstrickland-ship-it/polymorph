# Implementation Plan: Authoring — Tokens Studio Import

**Branch**: `claude/authoring-tokens-studio` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

## Summary

`@polymorph/authoring` becomes a real package shipping `importTokensStudio` + per-type converters
+ `lintMapping`. End-to-end proof: a generator emits a Tokens Studio export covering every
manifest token, the importer turns it into a Polymorph theme using an FI-style mapping config,
and `@polymorph/core.validateTheme` accepts the result.

## Technical Context

**Language/Version**: TS 5.7 ESM. **Deps**: `@polymorph/spec` (manifest + types). **Dev**:
`@polymorph/core` (for the end-to-end test), `@types/node`, vitest. **Testing**: vitest;
generated fixture covers all 68 tokens; per-converter unit tests cover edges. **Target**:
platform-neutral library. **Project Type**: monorepo library under `tooling/`.

## Constitution Check

| Principle | Status |
|---|---|
| I. Contract-First | PASS — output is a contract-shaped theme; consumers code against `pm.*` ids |
| II. Standards-Based | PASS — emits DTCG; Tokens Studio is a DTCG-adjacent input format |
| III. Versioned vocabulary | PASS — driven by the manifest; no vocabulary defined here |
| IV. Data + thin adapter | PASS — pure data transformation; no framework coupling |
| V. Hybrid rendering | N/A here |
| VI. Advisory a11y | N/A here |
| VII. Conformance-gated | PASS — the imported theme is validated by `runThemeConformance` via core |

No violations.

## Project Structure

```text
tooling/authoring/
├── scripts/gen-tokens-studio-fixture.mjs   # builds the e2e fixture from the contract manifest
├── src/
│   ├── types.ts          # TokensStudioExport / -Set / -Token / -Theme + MappingConfig
│   ├── convert.ts        # resolveValue + per-type converters (parseDimension, normalizeFontWeight, …)
│   ├── tokens-studio.ts  # importTokensStudio + lintMapping
│   └── index.ts
└── tests/
    ├── fixtures/         # generated tokens-studio.export.json + mapping.json
    ├── convert.test.ts
    └── import.test.ts    # end-to-end: import → @polymorph/core.validateTheme.valid
```

**Structure Decision**: Two-file source split — `convert.ts` for pure type-by-type helpers
(testable in isolation), `tokens-studio.ts` for the orchestrator that walks the mapping. The
fixture is generated from the manifest so it stays in sync as the vocabulary evolves; CI's drift
guard runs the generator and fails on diff.

## Complexity Tracking

> No violations — empty.
