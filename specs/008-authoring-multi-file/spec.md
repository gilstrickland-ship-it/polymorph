# Feature Specification: Authoring — Multi-file Tokens Studio Support

**Spec ID**: 008-authoring-multi-file

**Created**: 2026-05-28

**Status**: Implemented

**Input**: Follow-up to Spec G. Close the documented gap by adding multi-file Tokens Studio
support: a pure consolidator that turns a `{filename → JSON}` map into the existing
`TokensStudioExport` shape, plus a Node-side directory loader. The importer is unchanged —
single-file and multi-file paths share one downstream pipeline.

---

## Overview

Tokens Studio's "multi-file" export writes one JSON per token set, plus `$themes.json` and
`$metadata.json`. This spec adds:

- `consolidateTokensStudioFiles(files)` — pure, no fs. Routes `$themes.json` and
  `$metadata.json` into their special slots; every other `*.json` becomes a token set named
  after the file (with or without the `.json` suffix).
- `loadTokensStudioFromDirectory(dir)` — reads all top-level `*.json` in a directory and feeds
  them through `consolidateTokensStudioFiles`.

Both return a `TokensStudioExport` ready for `importTokensStudio`.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Import a multi-file Tokens Studio directory (Priority: P1)

An FI exports their Tokens Studio file as a folder (the Git-friendly form). The Node helper
reads the directory and the existing importer handles the rest.

**Independent Test**: A committed minimal multi-file fixture loads via
`loadTokensStudioFromDirectory` and equals the in-memory `consolidateTokensStudioFiles` of the
same files; a small mapping then imports cleanly.

### User Story 2 — Use the consolidator without fs (Priority: P2)

Browser tooling and other non-Node consumers pass a `{filename → parsedJSON}` map directly to
`consolidateTokensStudioFiles`.

**Independent Test**: Pure unit tests cover the routing rules ($themes / $metadata / regular
sets) and tolerance of keys with or without `.json`.

### Edge Cases

- `$themes.json` whose value isn't an array → skipped (defensive).
- Empty directory → empty `TokensStudioExport`.
- Round-trip: splitting a single-file export's top-level keys into separate files and
  consolidating reproduces the original.

---

## Requirements *(mandatory)*

- **FR-001**: `consolidateTokensStudioFiles(files)` MUST treat the `$themes` and `$metadata` keys
  specially and place every other JSON object under its filename (sans `.json`).
- **FR-002**: `loadTokensStudioFromDirectory(dir)` MUST read top-level `*.json` files only (no
  recursion in v1) and delegate consolidation to the pure function.
- **FR-003**: The output MUST be feedable to `importTokensStudio` without any changes to that
  function's contract.

---

## Success Criteria *(mandatory)*

- **SC-001**: Round-trip — splitting the existing single-file e2e fixture into per-key files and
  reconsolidating produces a deeply-equal `TokensStudioExport`.
- **SC-002**: The committed multi-file fixture loaded via `loadTokensStudioFromDirectory` matches
  the in-memory consolidation; a small mapping imports it cleanly (no `missing` / `unconvertible`)
  and resolves through aliases.
- **SC-003**: Whole workspace builds, typechecks, tests, and conforms from a cold state across
  the existing project count (11).

---

## Assumptions

- Nested-directory token sets and non-`.json` extensions are out of scope here.
- Browser consumers that want directory loading can build their own loader on top of
  `consolidateTokensStudioFiles` (e.g. against the File System Access API).
