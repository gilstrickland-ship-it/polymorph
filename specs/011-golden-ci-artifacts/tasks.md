---

description: "Task list for Spec K — CI artifact upload for failing golden diffs"
---

# Tasks: Golden CI Artifacts

**Input**: Design documents from `specs/011-golden-ci-artifacts/`.

## Phase 1: Interface

- [x] T001 `@polymorph/conformance`: add optional `diffPng?: Uint8Array` to `GoldenHarness.compare`'s return type (backward-compatible).

## Phase 2: Harness

- [x] T002 `@polymorph/golden-web`: `compare` now returns `diffPng` whenever the inner `diffPngs` produced one (i.e., the diff exceeded threshold).

## Phase 3: Test wiring

- [x] T003 `tests/golden.test.ts`: extract a `verifyGolden(name, payload)` helper that, on a non-match, writes `<name>.{actual,baseline,diff}.png` into `__diffs__/` and surfaces the directory in the failure message.
- [x] T004 Add a negative-path test (`compare surfaces a diffPng visualisation when the baseline differs`) using a temp dir + tampered baseline — no real baselines touched.

## Phase 4: Repo + CI

- [x] T005 `.gitignore`: add `**/__diffs__/`.
- [x] T006 `.github/workflows/ci.yml`: add an `if: failure()` `actions/upload-artifact@v4` step uploading `packages/**/__diffs__/**` as `golden-diffs` (14-day retention).

## Phase 5: Verification

- [x] T007 Tampering a baseline locally produces the three PNGs in `__diffs__/`; restoring leaves 9/9 tests green and no `__diffs__/` directory.
- [x] T008 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **13 projects**.
