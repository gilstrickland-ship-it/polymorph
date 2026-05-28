# Feature Specification: Authoring — Tokens Studio Import

**Spec ID**: 007-authoring-tokens-studio

**Created**: 2026-05-28

**Status**: Implemented (single-file consolidated export; multi-file deferred)

**Input**: First post-v1 authoring step. Take an FI's Tokens Studio JSON export (the most common
DTCG authoring tool) plus a `MappingConfig` of Polymorph semantic ids → Tokens Studio paths, and
produce a Polymorph theme that `@polymorph/core.validateTheme` accepts.

---

## Overview

`@polymorph/authoring` becomes a real package. Today it ships the Tokens Studio importer:

- `importTokensStudio(export, mapping)` → `{ theme, report }`
- Per-type converters (`convertToDtcg`, `parseDimension`, `normalizeFontWeight`,
  `normalizeLineHeight`, `normalizeOpacity`) plus `resolveValue` for alias chains
- `lintMapping(mapping)` — rejects misplaced mode-sensitive vs invariant ids

Why this now? After two adapters (RN + web) the contract shape is stable enough that an importer
maps confidently onto it.

---

## Clarifications

### Session 2026-05-28

- Q: Single-file vs multi-file Tokens Studio export? → A: **Single-file consolidated** for v1
  (the more common; one JSON object with sets at root + `$themes` + `$metadata`); multi-file
  comes as a follow-up.
- Q: Is the mapping FI-supplied or auto-derived? → A: **FI-supplied** — Tokens Studio paths are
  arbitrary per FI, so an automatic mapping would be guesswork. Auto-mapping heuristics can come
  in a follow-up.
- Q: Aliases preserved or resolved? → A: **Resolved** during conversion (the emitted Polymorph
  theme contains concrete values; no `{…}` references remain). Simpler, and equivalent for
  consumers since `@polymorph/core.resolveTheme` would resolve them anyway.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Import a Tokens Studio export into a valid Polymorph theme (Priority: P1)

An FI exports their Tokens Studio file and provides a mapping; the importer produces a theme that
`validateTheme` accepts; both declared modes resolve cleanly with distinct mode-sensitive values.

**Independent Test**: A generated end-to-end fixture (TS export + mapping for all 68 manifest
tokens) imports without `missing`/`unconvertible` and the result validates.

### User Story 2 — Convert per-type values faithfully (Priority: P1)

`spacing`/`sizing`/`borderRadius`/etc. → `dimension {value, unit}`; `typography` composite (with
TS-style `fontWeight: "Regular"`, `lineHeight: "150%"`) → DTCG sub-properties; `boxShadow` →
`shadow`; `opacity: "50%"` → `number 0.5`.

**Independent Test**: Per-converter unit tests cover each type and edge case.

### User Story 3 — Resolve Tokens Studio aliases (Priority: P2)

`{path.to.token}` references inside a value are resolved through the merged registry; dangling
references and cycles throw a clear error.

### User Story 4 — Catch mapping mistakes early (Priority: P2)

`lintMapping(config)` returns a list of errors for misplaced ids (mode-sensitive in `invariant`,
or mode-invariant in `modes.*`), so authors find mistakes before the import.

### Edge Cases

- A mapped Polymorph id whose path is absent in the merged set → reported in `report.missing`
  (importer continues).
- A token whose value can't be coerced (e.g. `spacing: "garbage"`) → reported in
  `report.unconvertible`.
- Composite sub-properties with `AUTO` (`lineHeight`) or `0%` (`letterSpacing`) → normalized.

---

## Requirements *(mandatory)*

- **FR-001**: `importTokensStudio(export, mapping)` MUST emit `{ contractVersion, pm: { … } }` with
  mode-invariant tokens under `pm.*` and mode-sensitive tokens under `pm.modes.<mode>.*`.
- **FR-002**: Set resolution MUST merge enabled sets in `mapping` order, later overriding earlier
  (matching Tokens Studio semantics).
- **FR-003**: Aliases inside Tokens Studio values MUST be resolved against the merged registry;
  unresolved aliases and cycles MUST throw with a clear message.
- **FR-004**: Per-type conversion MUST cover `color`, `dimension`, `typography`, `shadow`,
  `number`, `duration`, and `cubicBezier`. Unsupported types return `null` (skipped, surfaced in
  `report.unconvertible`).
- **FR-005**: The importer MUST NOT validate; the caller passes the result to
  `@polymorph/core.validateTheme`. The report describes what was imported, missed, or skipped.

---

## Success Criteria *(mandatory)*

- **SC-001**: A generated TS export covering all 68 manifest tokens imports with empty `missing`
  and `unconvertible`; the result `validateTheme.valid === true`.
- **SC-002**: Both declared modes resolve and mode-sensitive values differ between modes.
- **SC-003**: Per-converter unit tests pass for color / dimension / typography / shadow / opacity.
- **SC-004**: Whole workspace builds, typechecks, tests, and conforms from a cold state across
  the new project count.

---

## Assumptions

- Multi-file Tokens Studio exports, Figma direct, auto-extract, and the interactive theme builder
  are out of scope here (separate cycles per the roadmap).
- The mapping is FI-supplied; the package provides only `lintMapping` to sanity-check it.
