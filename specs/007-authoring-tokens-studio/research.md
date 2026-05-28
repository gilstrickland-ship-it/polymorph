# Phase 0 Research: Authoring — Tokens Studio Import

## R1 — Single-file vs multi-file Tokens Studio export

**Decision**: Target the **single-file consolidated** export for v1: one JSON object with token
sets at root plus `$themes` and `$metadata`. Multi-file (separate JSON per set) is the same data
in a different shape — add a thin loader later that consolidates it, reusing this importer.

**Rationale**: Most Tokens Studio users export the single-file form, especially for Git workflows.
Lower upfront surface; deferred work is mechanical.

## R2 — Tokens Studio vs DTCG field conventions

**Decision**: Tokens Studio uses unprefixed `value`/`type` (predates the W3C DTCG `$value`/`$type`
prefix). The importer reads `value`/`type` and emits `$value`/`$type` per DTCG. Description
strings carry through as `$description`.

## R3 — Mapping config (FI-supplied)

**Decision**: The mapping config is the FI's responsibility — `MappingConfig.invariant.ids` and
`modes.<mode>.ids` are records of `Polymorph semantic id → Tokens Studio dotted path`. We
provide `lintMapping` to reject misplaced entries (mode-sensitive in `invariant`, vice versa).

**Rationale**: Tokens Studio path naming is FI-specific; an automatic mapping would be guesswork.
Auto-mapping heuristics (e.g. fuzzy match) can layer on top in a follow-up.

## R4 — Alias resolution at import time

**Decision**: Resolve `{path.to.token}` aliases inside the merged Tokens Studio registry during
conversion; emit concrete values in the Polymorph theme.

**Rationale**: Simpler output — the resolver in `@polymorph/core` already collapses aliases when
producing a `ResolvedTheme`, so preserving them would be cosmetic. Dangling aliases and cycles
throw a clear error.

## R5 — Per-type conversion

**Decision**: Coverage for v1: `color`, `dimension` (from `spacing`/`sizing`/`borderRadius`/
`borderWidth`/`dimension`/etc.), `typography` (composite with TS-style sub-properties), `shadow`
(`boxShadow`, single or array), `number` (from `opacity`, including `"50%"`), `duration`
(number or `"200ms"`/`"0.2s"`), `cubicBezier` (4-tuple passthrough).

Notable normalizations:
- `fontWeight: "SemiBold"` → 600 (full mapping in `convert.ts`).
- `lineHeight: "150%"` → 1.5; `"AUTO"` → 1.2.
- `letterSpacing: "0%"` → `{ value: 0, unit: "px" }` (Tokens Studio's % isn't representable as a
  CSS dimension; treat as 0 px until a future tracking-percentage convention).
- `boxShadow.type: "innerShadow"` → `inset: true` on the DTCG shadow value.

Unsupported / unknown TS types return `null` from `convertToDtcg`; the importer reports them
under `unconvertible` rather than throwing.

## R6 — End-to-end testability

**Decision**: A small generator (`scripts/gen-tokens-studio-fixture.mjs`) reads the manifest and
emits a Tokens Studio export + a matching mapping covering every token. The test imports the
fixture and asserts `@polymorph/core.validateTheme.valid === true` + that both modes resolve
distinctly. CI's drift guard runs the generator and fails on diff so the fixture stays in sync.

**Rationale**: Hand-authoring 68 tokens × 2 modes by hand is brittle; generation guarantees
coverage and pins the importer against the contract.
