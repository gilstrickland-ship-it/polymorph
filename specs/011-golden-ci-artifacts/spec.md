# Feature Specification: CI Artifact Upload for Failing Golden Diffs

**Spec ID**: 011-golden-ci-artifacts

**Created**: 2026-05-28

**Status**: Implemented

**Input**: Make a failing golden-screenshot test in CI actually reviewable. Today it just prints
the diff ratio; reviewers must re-run locally to see what changed. Surface the diff visualisation
as a downloadable CI artifact.

---

## Overview

Three small, coherent changes:

1. **`@polymorph/conformance.GoldenHarness.compare`** return shape gains an optional
   `diffPng?: Uint8Array` (additive, backward-compatible).
2. **`@polymorph/golden-web`** passes the inner `diffPngs` visualisation through `compare` on a
   non-match.
3. **The golden test** writes the actual / baseline / diff PNGs into `packages/golden-web/__diffs__/`
   on failure (paths surfaced in the failure message). CI uploads that directory as a
   `golden-diffs` artifact with `if: failure()`.

`__diffs__/` is `.gitignore`'d.

---

## Clarifications

### Session 2026-05-28

- Q: Change the interface, or write artifacts behind the scenes? → A: **Change the interface
  additively.** Adding `diffPng?: Uint8Array` is non-breaking and lets every harness implementation
  surface the visualisation; the test layer chooses where to write it.
- Q: Where do the artifacts live? → A: `packages/golden-web/__diffs__/` (per-package; matched by
  the workflow's `packages/**/__diffs__/**` glob so any future golden package picks it up free).
- Q: What goes in each failure? → A: three PNGs per failed scenario — `<name>.actual.png`,
  `<name>.baseline.png`, `<name>.diff.png` — so a reviewer can open all three side-by-side.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Reviewer sees the diff without re-running locally (Priority: P1)

A PR's golden test fails. The reviewer downloads the `golden-diffs` artifact from the run, opens
the `*.diff.png`, and immediately sees what changed.

**Independent Test**: Locally swapping in a wrong baseline causes the failed test to write three
PNGs into `__diffs__/`; the failure message names the directory.

### User Story 2 — Harness surfaces the diff (Priority: P1)

`GoldenHarness.compare` now returns `diffPng` when the diff exceeds threshold; the test asserts
this against a tampered temp baseline (no real baselines touched).

### Edge Cases

- A green run produces no `__diffs__/` directory and uploads nothing (the `upload-artifact`
  step's `if-no-files-found: ignore` covers any other case).
- A missing baseline is still reported as `match:false, diffRatio:1` (no `diffPng` — there's
  nothing to diff against).

---

## Requirements *(mandatory)*

- **FR-001**: `GoldenHarness.compare` MUST be allowed to return `diffPng?: Uint8Array` (optional).
- **FR-002**: `createWebGoldenHarness().compare` MUST return `diffPng` whenever the inner
  `diffPngs` produced one (i.e., the diff exceeded the threshold).
- **FR-003**: The golden test MUST write `<name>.{actual,baseline,diff}.png` into
  `packages/golden-web/__diffs__/` on a non-match, and reference that path in the failure
  message.
- **FR-004**: `**/__diffs__/` MUST be `.gitignore`d.
- **FR-005**: The CI workflow MUST upload `packages/**/__diffs__/**` as a `golden-diffs` artifact
  on job failure (`if: failure()`).

---

## Success Criteria *(mandatory)*

- **SC-001**: Forcing a baseline mismatch locally writes the three PNGs into `__diffs__/` and
  fails the test with a message naming the directory. Restoring the baseline produces a clean
  workspace and 9/9 pass.
- **SC-002**: The new negative test (`compare surfaces a diffPng visualisation when the baseline
  differs`) asserts `result.diffPng` is a non-empty `Uint8Array`.
- **SC-003**: Whole workspace builds, typechecks, tests, and conforms from a cold state across
  **13 projects**; green runs leave no `__diffs__/` directory.

---

## Assumptions

- Any future golden harness (e.g. RN, or a Playwright-backed sibling) follows the same
  `__diffs__/` convention to be picked up by the CI glob.
- The artifact retention period (14 days) is sufficient for PR review; longer-lived storage
  is not in scope.
