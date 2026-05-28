---

description: "Task list for Spec H — Authoring: Multi-file Tokens Studio support"
---

# Tasks: Authoring — Multi-file Tokens Studio Support

**Input**: Design documents from `specs/008-authoring-multi-file/`. Follow-up to Spec G.

## Phase 1: Implementation

- [x] T001 `tooling/authoring/src/multi-file.ts`: `consolidateTokensStudioFiles(files)` (pure; routes `$themes.json` / `$metadata.json`, treats every other key as a set named after the file, tolerates with/without `.json`) and `loadTokensStudioFromDirectory(dir)` (Node fs, reads top-level `*.json`).
- [x] T002 Re-export both from `src/index.ts`. The downstream `importTokensStudio` API is unchanged.

## Phase 2: Fixture + tests

- [x] T003 Committed minimal multi-file fixture under `tests/fixtures/multi-file/`: `global.json`, `light.json`, `$themes.json`, `$metadata.json`.
- [x] T004 `tests/multi-file.test.ts`:
  - Pure consolidator: routes $themes / $metadata / regular sets; accepts keys with or without `.json`; defensively ignores a non-array `$themes`.
  - `loadTokensStudioFromDirectory` against the committed fixture matches the in-memory consolidation; a small mapping imports it cleanly (verifies alias resolution from `{color.neutral.white}` flows through to `pm.color.surface.base.$value === "#ffffff"`).
  - Round-trip: splitting the existing single-file e2e fixture by top-level key and reconsolidating produces a deeply-equal `TokensStudioExport`.

## Phase 3: Polish

- [x] T005 README: add the multi-file section + example; update the deferred list.
- [x] T006 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **11 projects**; 23 authoring tests (12 convert + 6 e2e + 5 multi-file).

## Notes

- No new package; this extends `@polymorph/authoring`.
- The CI drift guard isn't affected — the multi-file fixture is hand-authored (not generated),
  and the single-file generator is unchanged.
