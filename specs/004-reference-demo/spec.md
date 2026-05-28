# Feature Specification: Reference Demo + Mock Banks

**Spec ID**: 004-reference-demo

**Created**: 2026-05-27

**Status**: Implemented

**Input**: Spec D from the approved Polymorph plan — the reference vendor onboarding SDK plus two
mock-bank design systems (Aurora, Borealis) and host shells, proving the thesis: **the same SDK
renders into two distinct banks with zero SDK source changes.**

---

## Overview

- **`examples/reference-sdk-onboarding`** — an account-opening wizard (welcome → details w/
  validation → review + disclosure) built **only** against the contract via
  `@polymorph/adapter-react-native` components. No host primitives, no hard-coded colors/sizes, no
  bank imports.
- **`examples/mock-bank-aurora` / `mock-bank-borealis`** — two complete, valid, visually-distinct
  DTCG token sets (generated from the contract manifest) plus host shells that mount the unmodified
  SDK via `<ThemeProvider theme={resolveTheme(bank, mode)}>`.

---

## Clarifications

### Session 2026-05-27

- Q: The container can't run React Native — how to prove the demo? → A: deliver the SDK + themes +
  shells (typechecked) and prove the thesis **headlessly**: both themes validate against the
  contract; resolving each bank yields distinct values for the tokens the SDK depends on; and a
  static check confirms the SDK source contains no primitives/colors/bank imports. **On-device /
  visual rendering is verified later** (run the shells under Expo/RN); golden screenshots are Spec E.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Same SDK, two banks, zero edits (Priority: P1)

The reference SDK is dropped into Aurora and into Borealis. Each renders in that bank's look with
**no change to the SDK source** — only the theme differs.

**Independent Test**: Resolve both bank themes; the tokens the onboarding UI uses are all present
in both and the bank-defining ones differ; the SDK source is byte-identical across both shells.

**Acceptance**:
1. **Given** Aurora and Borealis themes, **When** each is resolved, **Then** the onboarding's used
   tokens resolve in both and brand tokens (surface, body text, primary action, border, control
   radius) differ.
2. **Given** the two host shells, **When** compared, **Then** they differ only by the theme import.

### User Story 2 — Mock banks conform to the contract (Priority: P1)

Each bank theme validates against `@polymorph/spec` (schema + graph) with no schema changes.

**Independent Test**: `validateTheme(aurora).valid && validateTheme(borealis).valid`.

### User Story 3 — SDK is coded against the contract only (Priority: P2)

The SDK references semantic components/ids exclusively — never primitives, raw colors, or bank code.

**Independent Test**: a static scan of the SDK source finds no hex/`rgb()` literals, no
`react-native` import, no `@polymorph/example-mock-bank-*` import; imports are limited to the
adapter, the spec types, and `react`.

### User Story 4 — Host shells mount the SDK (Priority: P3)

Each bank ships an `App` that wraps the SDK in a `ThemeProvider` fed by its resolved theme. (Run
on-device with Expo/RN; not executed in CI.)

### Edge Cases

- Both banks provide `light` + `dark`; resolving `dark` differs from `light`.
- The proof tests import only `@polymorph/core` + node fs (never the SDK's RN components), so they
  run headlessly.

---

## Requirements *(mandatory)*

- **FR-001**: The reference SDK MUST implement a multi-step onboarding flow (welcome, a validated
  details form, review + disclosure) using only `@polymorph/adapter-react-native` components.
- **FR-002**: The SDK source MUST contain no hard-coded colors/dimensions, no `react-native`
  import, and no bank-specific import (Constitution Principle I).
- **FR-003**: Each mock bank MUST ship a complete, contract-valid DTCG theme (all required tokens,
  `light` + `dark`), visually distinct from the other.
- **FR-004**: Each mock bank MUST provide a host shell that mounts the unmodified SDK via
  `ThemeProvider` + a resolved theme.
- **FR-005**: Swapping the SDK between banks MUST require **zero** SDK source edits (only the theme
  import differs between shells).

---

## Success Criteria *(mandatory)*

- **SC-001**: Both bank themes validate against the contract (no schema change).
- **SC-002**: Resolving the two banks yields distinct values for the SDK's brand tokens; all used
  tokens present in both.
- **SC-003**: Static analysis confirms the SDK uses the contract only (no primitives/colors/bank
  imports).
- **SC-004**: All example packages typecheck; the proof tests pass; the whole workspace is green.

---

## Assumptions

- On-device/visual rendering and golden screenshots are out of scope here (Spec E / device run).
- Bank themes are generated from the contract manifest (`examples/gen-mock-bank-themes.mjs`) to
  guarantee completeness; values are bank-specific to make the re-skin visible.
