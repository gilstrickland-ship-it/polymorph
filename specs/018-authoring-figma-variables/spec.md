# Feature Specification: Figma Variables Importer

**Spec ID**: 018-authoring-figma-variables

**Created**: 2026-05-28

**Status**: Implemented

**Input**: Second authoring path alongside the Tokens Studio importer. Figma's native
**Variables** feature (released 2023) lets designers define design tokens directly in Figma
without the Tokens Studio plugin. Many orgs prefer the native surface; this spec adds an
importer so those teams don't have to install Tokens Studio just to integrate with Polymorph.

---

## Overview

`@polymorph/authoring` gains `importFigmaVariables(response, mapping)`, parallel to
`importTokensStudio(export, mapping)`. Inputs:

1. A Figma REST API Variables response (`GET /v1/files/:fileKey/variables/local`).
2. A `FigmaMapping`: Polymorph semantic id → Figma variable name, plus Polymorph mode →
   Figma mode name, plus an optional collection-name filter.

Output: the same `ImportResult` shape (`{ theme, report }`) — meaning every adapter, the CLI,
and the docs pipeline keep working unchanged.

### Scope

Figma Variables only carries four scalar types: `COLOR`, `FLOAT`, `STRING`, `BOOLEAN`. So this
importer covers exactly four Polymorph types:

- `color` ← `COLOR` (Figma `{ r, g, b, a }` 0…1 → `#rrggbb` or `#rrggbbaa`).
- `dimension` ← `FLOAT` (assumed `px`).
- `number` ← `FLOAT` (passthrough).
- `duration` ← `FLOAT` (assumed `ms`).

**Out of scope**: `typography`, `shadow`, `cubicBezier`. Figma stores those as Text Styles /
Effect Styles, which live behind different REST endpoints (`/v1/files/:key/styles`) and are
shaped completely differently. Orgs with mixed needs author those tokens by hand or via Tokens
Studio.

---

## Clarifications

### Session 2026-05-28

- Q: Eager alias resolution vs. preserving Figma aliases as DTCG aliases? → A: **Eager**. Match
  the Tokens Studio importer's behaviour. The emitted theme has no aliases left, which keeps
  diffing themes and validating them straightforward. (Future: a `--preserve-aliases` option
  if a user demand emerges.)
- Q: Multi-collection files — pick first, all, or require explicit selection? → A: First
  collection by default; `mapping.collection` (by name) is the explicit selector. Throws if
  the named collection isn't found.
- Q: Mode-sensitive routing? → A: Same rule as Tokens Studio — `manifest.modeSensitive` decides
  whether the token emits under `pm.*` (using the default mode) or `pm.modes.<mode>.*` (per
  mode in `mapping.modes`).
- Q: Alpha handling for colors? → A: Pass through. `a < 1` → `#rrggbbaa`. The contract accepts
  any CSS Color 4 form (`#rrggbb` and `#rrggbbaa` both validate).
- Q: STRING / BOOLEAN variables? → A: Not routed in v1 (the contract has no plain-text or
  boolean tokens). They'll surface as `unconvertible` in the report if mapped, alerting the
  caller.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — An FI imports from Figma Variables (Priority: P1)

The FI's design team maintains its color, spacing, radius, opacity, and motion tokens in
Figma Variables. The team's build script:

1. Fetches the Variables JSON from the Figma REST API.
2. Calls `importFigmaVariables(response, mapping)` with a hand-authored mapping covering the
   subset of Polymorph tokens the team owns in Figma.
3. Hand-authors the remaining typography / shadow tokens (or imports them from another
   source).
4. Merges and emits the final `*.tokens.json` for delivery.

**Independent Test**: `tests/figma-variables.test.ts` — end-to-end import against a hand-built
fixture; assertions on `report` (no missing / unconvertible), tree-shape of the resulting
theme, and alias resolution semantics.

### User Story 2 — Reporting (Priority: P1)

When a mapped Polymorph id has no matching Figma variable (typo in `mapping.ids`), it lands in
`report.missing`. When a mapped id targets a Polymorph type Figma can't satisfy
(`pm.typography.*` → COLOR), it lands in `report.unconvertible`. The caller can decide whether
to fail loud or carry on.

### User Story 3 — Alias chains (Priority: P2)

A Figma variable can reference another (`{ type: "VARIABLE_ALIAS", id: "..." }`). The importer
follows chains across mode boundaries, picks the target's value at the same Figma mode id
(falling back to the target's collection default if the target lacks that mode), and emits
the concrete value.

### Edge Cases

- **Alias cycle** — `resolveAlias` throws `alias cycle through <id>`.
- **Dangling alias** — throws `alias references unknown variable id: <id>`.
- **Mode not present on a variable** — recorded as `missing` for that specific mode; other
  modes for the same id are unaffected.
- **`mapping.collection` doesn't match** — throws `No Figma variable collection named "<name>"`.

---

## Requirements *(mandatory)*

- **FR-001**: `importFigmaVariables(response, mapping)` MUST return the same `ImportResult`
  shape as the Tokens Studio importer (`{ theme, report }`), so downstream code reuses.
- **FR-002**: Mapping MUST be explicit (`FigmaMapping.ids` keyed by Polymorph semantic id). The
  importer MUST NOT auto-guess mappings from variable names.
- **FR-003**: Aliases (`{ type: "VARIABLE_ALIAS", id }`) MUST be resolved eagerly to concrete
  values; the emitted theme MUST NOT carry any Figma alias objects.
- **FR-004**: Mode routing MUST consult `manifest.modeSensitive` — mode-sensitive ids emit
  under `pm.modes.<mode>.*`; mode-invariant ids emit under `pm.*` using the collection's
  default mode.
- **FR-005**: `convertFigmaValue(value, targetType)` MUST return `null` for unsupported target
  types (`typography`, `shadow`, `cubicBezier`) so the importer reports them as
  `unconvertible`.
- **FR-006**: `figmaColorToHex({r,g,b,a})` MUST emit `#rrggbb` when alpha is `1` and
  `#rrggbbaa` when alpha is `< 1`.
- **FR-007**: Alias cycles and dangling references MUST throw with clear, located error
  messages.
- **FR-008**: The importer MUST be exported from `@polymorph/authoring`'s barrel alongside the
  Tokens Studio importer — both available under the same package.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/figma-variables.test.ts` — 15 tests passing: end-to-end import (4),
  reporting (2), per-type conversion (5), alias resolution (3), hex formatting (1).
- **SC-002**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across the existing project count (**19**) — this spec adds files but no new project.
- **SC-003**: Docs site builds with a new `/guides/figma-variables` page in the Adoption
  sidebar; FI guide updated to mention the second importer path.

---

## Assumptions

- Orgs using this importer drive the Figma fetch themselves (token, file key, rate-limit
  policy). Polymorph stays an offline library — no Figma network code in `@polymorph/authoring`.
- Typography / shadow / cubicBezier come from a separate source (hand-authored DTCG, Tokens
  Studio, or a future Figma Text Styles / Effect Styles importer). v1 is single-purpose.
- Color alpha `< 1` lands as `#rrggbbaa`; the spec validator + `parseColor` already accept that
  form. No new schema changes needed.
