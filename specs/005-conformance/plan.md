# Implementation Plan: Conformance Suite

**Branch**: `005-conformance` (on `claude/compassionate-gauss-tLBN4`) | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

## Summary

`@polymorph/conformance`: a reusable assertion API (`runThemeConformance`, `assertConforms`,
`checkResolvedInvariants`, `checkLoaderEquivalence`) plus a `GoldenHarness` interface. Its tests run
the v1 acceptance corpus (Aurora + Borealis + spec fixtures), proving valid themes conform and
invalid ones don't, and that the three loaders agree. Golden-screenshot capture is deferred (needs
a renderer); a headless placeholder throws.

## Technical Context

**Language/Version**: TS 5.7 ESM, Node ≥ 20. **Deps**: `@polymorph/core`, `@polymorph/loaders`,
`@polymorph/spec` (workspace). **Testing**: vitest; reads the bank themes + spec fixtures via fs.
**Target**: platform-neutral library (the golden harness is implemented per-adapter on a renderer).
**Project Type**: monorepo library with an Nx `conformance` target.

## Constitution Check

| Principle | Status |
|---|---|
| I. Contract-First | PASS — checks operate on `pm.*` ids only |
| II. Standards-Based | PASS — validity delegates to the contract schema via core |
| III. Versioned vocabulary | PASS — uses the manifest's required set |
| IV. Data + thin adapter | PASS — invariants assert the neutral ResolvedTheme shape |
| V. Hybrid rendering | PASS — component-fallback invariant covers the hybrid model |
| VI. Advisory a11y | PASS — lint stays advisory; not a conformance gate here |
| VII. Conformance-gated | PASS — this *is* the gate; `pnpm conformance` runs it |

No violations.

## Project Structure

```text
packages/conformance/
├── src/
│   ├── checks.ts             # runThemeConformance / checkResolvedInvariants / assertConforms
│   ├── loader-equivalence.ts # checkLoaderEquivalence (Inline/Bundled/RemoteManifest)
│   ├── golden.ts             # GoldenHarness interface + headless placeholder (deferred)
│   └── index.ts
└── tests/conformance.test.ts # runs the v1 acceptance corpus (banks + spec fixtures)
```

**Structure Decision**: A small, dependency-light library exporting the bar so adapters (and CI)
reuse it. The `conformance` Nx target runs vitest headlessly; golden capture plugs in via the
`GoldenHarness` interface on a device. `paths:{}` so workspace imports resolve to built dist.

## Complexity Tracking

> No violations — empty.
