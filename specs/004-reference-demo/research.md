# Phase 0 Research: Reference Demo + Mock Banks

## R1 — Proving the thesis without a device

**Decision**: Prove "same SDK, two banks, zero edits" with three headless checks: (1) both bank
themes `validateTheme` as valid; (2) `resolveTheme` for each bank yields all the tokens the SDK
uses, with the brand-defining ones differing; (3) a static scan of the SDK source finds no
primitives/colors/`react-native`/bank imports. On-device rendering + golden screenshots are
deferred (Spec E / device run).

**Rationale**: The container has no RN runtime; these checks exercise the real data path (contract
+ core) and statically guarantee contract adherence — the substance of the proof — without
rendering.

## R2 — Generating distinct, valid bank themes

**Decision**: Generate both themes from the contract manifest (`gen-mock-bank-themes.mjs`): iterate
every token, assign a value by type from a compact per-bank design language (palette + derive
helpers for surfaces/text/states/borders; bank-specific radius/space/type). Emit `light` + `dark`.

**Rationale**: Guarantees completeness (all 41 required present, correct types) and makes the two
banks genuinely distinct (Aurora: cool/blue/rounded/airy; Borealis: warm/green/sharp/dense) so the
re-skin is visible. Hand-authoring 60+ tokens × 2 modes × 2 banks would be error-prone.

## R3 — Keeping the SDK free of react-native

**Decision**: Add a `Stack` layout primitive to the adapter so the SDK composes pure layout
(`Screen`/`Card`/`Stack`/`ThemedText`/`Field`/`PrimaryButton`/`StepIndicator`) without importing
`react-native` or hard-coding spacing. The SDK imports only the adapter + `react`.

**Rationale**: Lets the contract-adherence scan pass and keeps the SDK a clean example of
"contract-only" code.

## R4 — Example typecheck resolution

**Decision**: Example typecheck configs set `paths:{}` so `@polymorph/*` resolve to built dist
(whose `.d.ts` are RN-free) rather than the base path-mapped source (which would pull the adapter's
`react-native` import into the example program).
