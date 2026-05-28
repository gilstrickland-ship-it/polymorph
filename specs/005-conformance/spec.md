# Feature Specification: Conformance Suite

**Spec ID**: 005-conformance

**Created**: 2026-05-27

**Status**: Implemented (golden-screenshot harness deferred)

**Input**: Spec E from the approved Polymorph plan — the reusable, cross-adapter **conformance
suite**: shared assertions and fixtures every theme/adapter must pass, plus a golden-screenshot
harness. The v1 acceptance bar: the reference SDK renders correctly across both mock banks with
zero SDK source changes.

---

## Overview

`@polymorph/conformance` packages the cross-cutting bar so it isn't re-implemented per package or
per adapter:

- **Theme/runtime conformance** (headless): validity (schema + graph), resolution invariants (all
  required present, no aliases remain, pm-only keys, component fallback applied) for every declared
  mode, and **loader equivalence** (Inline/Bundled/RemoteManifest agree).
- **Golden-screenshot conformance**: a `GoldenHarness` interface adapters implement on a platform
  renderer. Capturing/diffing pixels needs a device/Expo/browser, so it is **deferred** in the
  headless container (a `headlessGoldenHarness` throws to make the deferral explicit).

It runs the v1 acceptance corpus — the Aurora and Borealis mock banks plus the `@polymorph/spec`
fixtures — as its tests.

---

## Clarifications

### Session 2026-05-27

- Q: Golden screenshots need a renderer the container lacks — how to scope Spec E? → A: ship the
  **headless** conformance (validity, resolution invariants, loader equivalence) as runnable tests
  + a reusable assertion API; provide the **golden harness as an interface** with a headless
  placeholder that throws; capture baselines on-device later.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Assert a theme conforms (Priority: P1)

A theme author / adapter author runs the bar over a theme and gets a pass/fail report or a thrown
error listing the failed checks.

**Independent Test**: `runThemeConformance(aurora).passed === true`; `assertConforms(badTheme)`
throws listing failures.

**Acceptance**:
1. **Given** a contract-valid bank theme, **When** `runThemeConformance`, **Then** `passed` is true.
2. **Given** an invalid theme, **When** `runThemeConformance`, **Then** `passed` is false and the
   failing checks are itemized; `assertConforms` throws with that list.

### User Story 2 — Resolution invariants hold per mode (Priority: P1)

For each declared mode, the resolved theme has all required tokens, no remaining aliases, pm-only
keys, and resolved component fallbacks.

**Independent Test**: `checkResolvedInvariants(resolveTheme(bank, mode))` all pass for light + dark.

### User Story 3 — Loader equivalence (Priority: P2)

The same theme via Inline, Bundled, and RemoteManifest resolves identically.

**Independent Test**: `checkLoaderEquivalence(bank, mode).passed` for both banks, both modes.

### User Story 4 — Golden-screenshot harness (Priority: P3, deferred)

Adapters implement `GoldenHarness` to capture/compare rendered baselines on a platform renderer.

**Independent Test**: type-level (the interface); on-device baseline capture is out of scope here.

### Edge Cases

- An invalid theme fails at the validity check and short-circuits resolution checks.
- The headless golden harness throws `GoldenHarnessUnavailableError` to surface the deferral.

---

## Requirements *(mandatory)*

- **FR-001**: The suite MUST expose `runThemeConformance(theme) → ConformanceReport` covering
  validity + per-mode resolution invariants, and `assertConforms(theme)` throwing an itemized error.
- **FR-002**: It MUST expose `checkResolvedInvariants(resolved)` (required present, no aliases,
  pm-only keys, component fallback) and `checkLoaderEquivalence(theme, mode)`.
- **FR-003**: It MUST run the v1 acceptance corpus (Aurora + Borealis + spec fixtures) as tests:
  valid themes conform, invalid ones do not.
- **FR-004**: It MUST define a `GoldenHarness` interface for screenshot conformance and provide a
  headless placeholder; pixel capture/diff is deferred to a device run.
- **FR-005**: The headless suite MUST be runnable via `pnpm conformance` (an Nx `conformance`
  target) with no device.

---

## Success Criteria *(mandatory)*

- **SC-001**: Both mock banks pass `runThemeConformance` (validity + invariants + all modes).
- **SC-002**: Spec valid fixtures conform; invalid fixtures do not.
- **SC-003**: Loader equivalence holds for both banks across light + dark.
- **SC-004**: `pnpm conformance` is green; the whole workspace is green.

---

## Assumptions

- Golden screenshots are captured on-device (Expo/RN) in a follow-up; the harness interface lets
  that plug in without changing the headless suite.
- The suite depends on `@polymorph/core`, `@polymorph/loaders`, and `@polymorph/spec`.
