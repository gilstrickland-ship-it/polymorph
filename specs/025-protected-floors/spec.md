# Feature Specification: Protected-Surface Floors

**Spec ID**: 025-protected-floors

**Created**: 2026-05-28

**Status**: Implemented

**Input**: Regulated FIs (every adopter so far) repeatedly asked the same question: "How do
we guarantee a brand theme can't make our legal disclosures illegible?" The contract's
existing lint targets WCAG AA — fine for body / action text, too soft for regulator-mandated
copy. This spec adds a stricter floor for protected surfaces, enforced by the same advisory
lint pipeline.

---

## Overview

A new manifest file `packages/spec/manifest/protected-floors.v0.json` declares which
component roles hold protected content and what floor rules apply. The generator emits a
`PROTECTED_FLOORS` const from `@polymorph/spec`; `@polymorph/core`'s `lintTheme` adds a new
rule family that walks the floors, evaluates each rule against the resolved component
properties, and emits typed warnings.

Three new lint codes:

| Code | Threshold |
|---|---|
| `PROTECTED_CONTRAST_LOW` | foreground vs. `pm.color.surface.base` < 7:1 (WCAG SC 1.4.6 AAA-equivalent) |
| `PROTECTED_FONT_SIZE_SMALL` | typography `fontSize` < 14px |
| `PROTECTED_LINE_HEIGHT_TIGHT` | typography `lineHeight` < 1.5× |

Today, one role is flagged: `disclosure`. The set is open — future regulator-driven
surfaces add to the manifest without touching the lint code.

---

## Clarifications

### Session 2026-05-28

- Q: New manifest file or extend `semantic-vocabulary.v0.json`? → A: **New file
  (`protected-floors.v0.json`).** Floors are lint-level, not structural. Putting them in the
  vocabulary would churn the schema generator on every floor edit and conflate concerns.
- Q: Versioning of the floors manifest? → A: **Independent of the contract version.**
  Tightening a threshold (e.g. 14px → 16px font-size) shouldn't bump
  `contractVersion`; it's an advisory adjustment.
- Q: Should the lint be blocking? → A: **No — advisory like every other lint rule.**
  Per the constitution, `lintTheme` never throws. FIs gate CI on the warning set; the
  contract surfaces the signal.
- Q: How does an FI satisfy the floors? → A: **Override the protected role's properties.**
  `disclosure` defaults to `text.muted` foreground + `caption` typography (intentionally
  soft); FIs override to body-class values for protected copy. Documented in the guide.
- Q: Which roles are protected today? → A: **`disclosure` only.** The existing role
  already lives in the manifest with sensible default properties (`foreground` +
  `typography`); we add floors over it rather than introducing a parallel
  `legalDisclosure` role.
- Q: What background does contrast measure against? → A: **`pm.color.surface.base`** by
  default. The floor rule carries `bgToken`, so a future protected role with a different
  background floor (e.g. `pm.color.surface.raised`) configures it explicitly.
- Q: Auto-fix? → A: **No.** The lint identifies; the FI's compliance + design teams own
  the fix. Auto-fix introduces opinion the contract shouldn't carry.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A bank ships a brand theme; CI flags an illegible disclosure (Priority: P1)

The FI's brand theme leaves the `disclosure` role at defaults. `lintTheme` returns three
`PROTECTED_*` warnings; the FI's CI gate fails the build until they override the role.

**Independent Test**: `tests/protected-floors.test.ts` — Aurora's defaulted disclosure
trips all three floor codes.

### User Story 2 — Overriding `disclosure` satisfies the floors (Priority: P1)

The FI authors `pm.disclosure.foreground` + `pm.disclosure.typography` with body-class
values. The next `lintTheme` pass returns zero `PROTECTED_*` warnings.

**Independent Test**: `tests/protected-floors.test.ts` — hand-injected lifted overrides
clear all three codes.

### User Story 3 — Manifest data carries through to consumers (Priority: P2)

`@polymorph/spec` exports `PROTECTED_FLOORS` as a typed const. Editor consumers
(`@polymorph/builder`'s `LintPanel`) style protected-rule rows via `data-pm-lint-code`
selectors.

**Independent Test**: `tests/protected-floors.test.ts` — manifest export has the expected
role + rule shape.

### Edge Cases

- **Protected role absent from the theme** (a theme that doesn't use `disclosure`): no
  warnings fire. Lint skips floors whose role has no resolved component properties.
- **Floor rule references an unparseable colour**: the contrast helper returns null; the
  rule emits no warning (consistent with the rest of the lint's contrast handling).
- **Floor rule via `typography` but the property carries no typography**: rule skips
  silently.

---

## Requirements *(mandatory)*

- **FR-001**: A new manifest file `packages/spec/manifest/protected-floors.v0.json` MUST
  declare floors for protected component roles, each carrying `role`, optional
  `rationale`, and an array of `rules`.
- **FR-002**: The spec generator MUST emit a `PROTECTED_FLOORS` const + typed
  `ProtectedFloor` / `ProtectedFloorRule` / `ProtectedFloorKind` from
  `@polymorph/spec`.
- **FR-003**: `@polymorph/core`'s `lintTheme` MUST add three new advisory codes —
  `PROTECTED_CONTRAST_LOW`, `PROTECTED_FONT_SIZE_SMALL`,
  `PROTECTED_LINE_HEIGHT_TIGHT` — and run them across every floor's rules.
- **FR-004**: Contrast rules MUST read the background from the floor's
  `bgToken` (`pm.color.surface.base` by default for the seed floor).
- **FR-005**: FontSize / lineHeight rules MUST read the component property declared by
  `viaProperty` and inspect the typography composite at `fontSize` / `lineHeight`.
- **FR-006**: Lint warnings MUST carry `tokenIds` including `${role}.${property}` so
  editor consumers can scroll-to-warning.
- **FR-007**: The rules MUST be advisory (never throw, never block validation), matching
  the rest of the lint per the constitution.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/protected-floors.test.ts` — 9 tests: 2 manifest shape, 4 over
  defaulted Aurora (3 codes fire + tokenIds carries `role.property`), 3 over lifted
  overrides (no codes fire).
- **SC-002**: Core total **52 tests** (was 43; +9 new).
- **SC-003**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across **21 projects** (no new package).
- **SC-004**: New docs page `/guide/protected-surfaces` shipped;
  `/guide/advisory-lint` updated with a Protected-surface floors subsection + the three
  new codes; sidebar entry added.

---

## Assumptions

- The seed floor set (`disclosure`) is the right one. FIs that surface other regulated
  copy use existing patterns until a follow-up spec extends the set.
- Floors are lint-only — no codegen / runtime emits enforcement. The contract's promise is
  that the *authored theme* meets the floor; runtime overrides are the FI's runtime concern.
- WCAG SC 1.4.6 AAA-equivalent 7:1 is the right contrast floor for protected text. FIs
  that need stricter thresholds add a project-local lint pass.
- 14px / 1.5× are conservative defaults. Most regulator guidance (CFPB, FCA, ASIC,
  MAS) treats those as the "comfortable reading" baseline for financial disclosures.
- The lint is advisory; CI gating remains the FI's policy. The contract surfaces the
  signal, not the policy.
