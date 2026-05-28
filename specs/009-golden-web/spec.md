# Feature Specification: Golden Web — On-device Verification (Headless)

**Spec ID**: 009-golden-web

**Created**: 2026-05-28

**Status**: Implemented (web platform; RN follow-up)

**Input**: Close the deferred "golden screenshot" thread from Specs C / D / E. Make
`@polymorph/conformance.GoldenHarness` real for the web platform — capture the bank-themed render
as a deterministic PNG, diff against a committed baseline, gate in CI. No browser binary required
(Playwright/Chromium CDN access is restricted in the build environment).

---

## Overview

`@polymorph/golden-web` is the first working implementation of `GoldenHarness`:

- **Render** via Satori (HTML/JSX → SVG) + resvg (SVG → PNG). Pure-Node, deterministic across
  Linux platforms.
- **Bundled font** (Inter via `@fontsource/inter`) so font rendering is identical everywhere.
- **Diff** via pixelmatch with a default 0.1% threshold.
- **Baselines** committed as PNGs under `packages/golden-web/baselines/`. The four committed
  baselines (`account-card-{aurora,borealis}-{light,dark}.png`) show the same scenario tree
  rendered with each bank's resolved tokens — Aurora ≠ Borealis, light ≠ dark.

---

## Clarifications

### Session 2026-05-28

- Q: Browser binary or pure Node? → A: **pure Node** (Satori + resvg). The CDN serving Chromium
  is blocked in our build environment, and the pure-Node pipeline is faster, smaller, and
  deterministic. A Playwright-backed harness can be a sibling package once it's worth running in
  CI.
- Q: Font rendering deterministic? → A: bundle **Inter** (regular + bold) and **ignore the theme's
  `fontFamily`** for the golden diff. Font fidelity is not part of the contract; colors / radii /
  spacing are.
- Q: Diff threshold? → A: **0.1%** of pixels allowed (configurable). pixelmatch's per-pixel
  threshold is 0.1.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Verify a bank theme renders correctly (Priority: P1)

A scenario renders with the bank's resolved tokens; the resulting PNG matches the committed
baseline within the diff threshold.

**Independent Test**: `tests/golden.test.ts` — every `{scenario × bank × mode}` combination
captures and compares; 4/4 match (Aurora light, Aurora dark, Borealis light, Borealis dark).

### User Story 2 — Prove the re-skin is visible (Priority: P1)

The same scenario rendered with Aurora vs Borealis produces visibly different PNGs (and so does
light vs dark for the same bank). This is the "render correctly themed across both banks" half of
the v1 acceptance bar.

**Independent Test**: `diffPngs(aurora, borealis)` reports a non-trivial diff ratio (> 5% of
pixels); same for light vs dark.

### User Story 3 — Regenerate baselines after intentional changes (Priority: P2)

Authors run `pnpm --filter @polymorph/golden-web update-baselines` and review the resulting PNG
diff in their PR.

### Edge Cases

- Missing baseline → `compare` reports `{ match: false, diffRatio: 1 }` (or writes it if
  `update: true`).
- Capture without a proper payload → throws with a clear "expected WebGoldenPayload" message.
- Different image dimensions → reported as not matching (no crash).

---

## Requirements *(mandatory)*

- **FR-001**: The harness MUST satisfy `@polymorph/conformance.GoldenHarness` — `capture` returns
  `Uint8Array`, `compare` returns `{ match, diffRatio }`.
- **FR-002**: Rendering MUST be pure-Node (no browser binary or external service).
- **FR-003**: Rendering MUST be deterministic across Linux platforms — pinned `satori` and
  `@resvg/resvg-js` versions, bundled Inter font.
- **FR-004**: Diff MUST use pixelmatch; default threshold 0.1% (`0.001`); configurable.
- **FR-005**: Baselines MUST be committed under `packages/golden-web/baselines/` and updatable via
  the package's `update-baselines` script (`harness.compare(..., { update: true })`).
- **FR-006**: Scenarios MUST be plain Satori-compatible trees built from a `toTokenMap(resolved)`
  record so the bank-distinguishing tokens (surface, action, radii, spacing) drive the visible
  diff.

---

## Success Criteria *(mandatory)*

- **SC-001**: 4/4 committed baselines (Aurora/Borealis × light/dark) match within the threshold.
- **SC-002**: Aurora vs Borealis (light, same scenario) differs on > 5% of pixels; light vs dark
  for the same bank also > 5%.
- **SC-003**: `pnpm --filter @polymorph/golden-web update-baselines` regenerates all baselines.
- **SC-004**: Whole workspace builds, typechecks, tests, and conforms from a cold state across the
  new project count (12).

---

## Assumptions

- Font fidelity is not part of the golden diff (we bundle Inter and ignore theme font tokens).
- A browser-backed harness (Playwright) can land as `@polymorph/golden-web-browser` later if real
  browser fidelity is needed — same `GoldenHarness` interface.
- A React Native golden harness (e.g., via Skia or Expo dev clients) is a separate follow-up.
