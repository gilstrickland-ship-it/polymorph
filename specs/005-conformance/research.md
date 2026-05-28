# Phase 0 Research: Conformance Suite

## R1 — What the headless bar covers

**Decision**: Conformance = (a) **validity** (schema + graph via `@polymorph/core`), (b)
**resolution invariants** per declared mode — all required tokens present, no aliases remain,
pm-only keys, component fallback applied, and (c) **loader equivalence** (Inline/Bundled/
RemoteManifest resolve deep-equal). Exposed as `runThemeConformance`/`assertConforms` plus granular
checks.

**Rationale**: These are the data-level guarantees that make "one SDK, N banks" safe and are fully
testable without a renderer. They generalize across adapters (any adapter consumes the same
`ResolvedTheme`).

## R2 — Golden screenshots (deferred)

**Decision**: Define a `GoldenHarness` interface (`capture`/`compare`) adapters implement on a
platform renderer; ship a `headlessGoldenHarness` that throws `GoldenHarnessUnavailableError`.
Baselines are captured on-device (Expo/RN) in a follow-up.

**Rationale**: Pixel capture/diff needs React Native on device (or a browser for web) — unavailable
in the headless container. The interface keeps the seam so on-device capture plugs in without
changing the headless suite.

**Alternatives**: A WASM/canvas RN renderer (heavy, low fidelity — rejected); skipping the harness
entirely (loses the seam — rejected).

## R3 — Acceptance corpus

**Decision**: The suite's own tests run the v1 corpus: the **Aurora + Borealis** mock-bank themes
(read from `examples/`) and the **`@polymorph/spec`** valid/invalid fixtures. Valid → conform;
invalid → do not.

**Rationale**: Ties the reusable bar to the real v1 deliverables; if a bank theme or the contract
regresses, `pnpm conformance` fails.

## R4 — Packaging & target

**Decision**: A dependency-light library (`core` + `loaders` + `spec`) with an Nx `conformance`
target (`vitest run`) so `pnpm conformance` runs it; `paths:{}` resolves workspace imports to built
dist.
