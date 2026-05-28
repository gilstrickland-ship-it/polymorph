# Implementation Plan: Reference Demo + Mock Banks

**Branch**: `004-reference-demo` (on `claude/compassionate-gauss-tLBN4`) | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

## Summary

Build the v1 proof: a reference onboarding SDK coded only against the contract, two distinct
contract-valid mock-bank themes (Aurora, Borealis), and host shells. Prove "same SDK, two banks,
zero edits" headlessly (the container can't run RN): both themes validate, resolution yields
distinct values for the SDK's tokens, and a static scan confirms zero primitives in the SDK.

## Technical Context

**Language/Version**: TS 5.7 ESM. **Packages**: `@polymorph/example-reference-sdk-onboarding`,
`@polymorph/example-mock-bank-aurora`, `@polymorph/example-mock-bank-borealis` (private). **Deps**:
`@polymorph/adapter-react-native`, `@polymorph/spec`, `react`; shells also `@polymorph/core` +
the reference SDK; proof tests use `@polymorph/core`. **Testing**: vitest (headless: core + fs +
source scan — never imports the SDK's RN components). **Target**: React Native (shells run on
device/Expo, not in CI). **Project Type**: monorepo example apps (typecheck-only; no dist build).

## Constitution Check

| Principle | Status |
|---|---|
| I. Contract-First | PASS — SDK uses adapter components only; enforced by the static scan test |
| II. Standards-Based | PASS — bank themes are DTCG, validated by the contract |
| III. Versioned vocabulary | PASS — themes target contract v0 |
| IV. Data + thin adapter | PASS — re-skin is a theme/data change; shells differ only by theme import |
| V. Hybrid rendering | PASS — SDK uses themed components; slots/mapping available, not required |
| VI. Advisory a11y | PASS — not enforced; banks could be linted via core |
| VII. Conformance-gated | PASS — proof tests (validity, re-skin, adherence) feed Spec E |

No violations.

## Project Structure

```text
examples/
├── gen-mock-bank-themes.mjs              # generates both bank themes from the manifest
├── reference-sdk-onboarding/
│   ├── src/{onboarding.tsx,index.ts}     # the wizard, contract-only
│   └── tests/{reskin,contract-adherence}.test.ts
├── mock-bank-aurora/
│   ├── theme/aurora.tokens.json          # generated, distinct
│   └── src/{App.tsx,index.ts}            # host shell
└── mock-bank-borealis/ (same shape)
```

**Structure Decision**: Examples are typecheck-only (no dist). The reference SDK is composed solely
from `@polymorph/adapter-react-native` components (incl. the new `Stack` layout primitive), so it
imports no `react-native`. Proof tests import only `@polymorph/core` + node, keeping them runnable
in a headless container. Example typecheck configs set `paths:{}` so cross-package imports resolve
to built dist (RN-free types), not source.

## Complexity Tracking

> No violations — empty.
