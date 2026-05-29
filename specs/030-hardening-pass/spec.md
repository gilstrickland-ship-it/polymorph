# Feature Specification: Hardening Pass

**Spec ID**: 030-hardening-pass

**Created**: 2026-05-29

**Status**: Implemented

**Input**: Cycles 023–029 added rule families, runtime helpers, builder fields, and new
CLI subcommands. A targeted hardening pass over the shipped surface found four real gaps:
a built-in lint code that lived outside the `LintCode` union, a `LintWarning` shape that
required numeric fields most rules don't carry, a builder hook that wrote component
overrides to the wrong path (silently never took effect), and a missing
`lintAllModesWithPolicies` symmetry helper.

---

## Overview

Four targeted fixes, plus tests + doc updates:

| Surface | Fix |
|---|---|
| `LintCode` union | Add `POLICY_RULE_ERROR` to the closed set so the runtime's own emit narrows. |
| `LintWarning` shape | `measured` / `threshold` widen to `number \| undefined`. Most policy-pack codes don't carry a numeric pair; `POLICY_RULE_ERROR` doesn't either. |
| `warning()` helper | Drop the `0`-default coercion; pass `undefined` to omit. |
| `useThemeEditor.setComponentProperty` | Write under `pm.<role>.<property>` (the resolver's read path), not `pm.components.<role>.<property>`. |
| Builder state | New `changedComponentPaths: ReadonlySet<string>` carrying the dotted `role.property` set; `dirty` derives from union of token + component changes. |
| `lintAllModesWithPolicies(theme, packs)` | Mirrors `lintAllModes` — composes policy packs across every declared mode. |

---

## Clarifications

### Session 2026-05-29

- Q: Build a stricter `LintCode` enforcement (e.g. exhaust all built-in codes)? → A: **No
  — just close the missing one.** `LintCode` is the closed set; widening it to "any
  string" via `CustomLintCode` was the prior call. Built-in codes still get autocomplete;
  policy-pack codes pass structurally. Adding `POLICY_RULE_ERROR` to the union is the only
  correction needed.
- Q: Make `LintWarning.measured` / `threshold` optional, or default them to `null`?
  → A: **Optional (`?: number`).** TypeScript-idiomatic for fields that may be absent.
  Lets the lint panel test `w.measured !== undefined` rather than `w.measured !== null`,
  which composes better with existing optional patterns.
- Q: How to track component-property changes in the builder state — extend
  `changedTokenIds`, or add a parallel set? → A: **Parallel set.** Widening
  `changedTokenIds`'s type to `ReadonlySet<SemanticTokenId | string>` would lose
  narrowing for token-id consumers; a separate `changedComponentPaths` set is honest
  about what each contains.
- Q: How should the builder hook know which path is a component-property override vs. a
  regular token? → A: **`COMPONENT_ROLES` from `@polymorph/spec`.** Import the roles
  array, build a top-segment lookup set, and check the second segment of any
  `pm.<x>.…` path. The contract's schema enumerates the closed role set anyway.
- Q: Naming for the new lint helper? → A: **`lintAllModesWithPolicies` — mirror
  `lintAllModes`.** Discoverable via autocomplete, symmetric with the built-in name.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — `POLICY_RULE_ERROR` narrows in CI scripts (Priority: P2)

A CI script switches on `LintWarning.code` to escalate codes into different severities.
With `POLICY_RULE_ERROR` in the union, TS narrows correctly:

```ts
switch (w.code) {
  case "PROTECTED_CONTRAST_LOW": …
  case "POLICY_RULE_ERROR": …  // now type-narrows
}
```

**Independent Test**: `tests/policy-packs.test.ts` — emit `POLICY_RULE_ERROR`, assert
`measured` / `threshold` are `undefined`.

### User Story 2 — Builder authors component overrides that take effect (Priority: P1)

The FI's design-system team uses the builder to override `button.primary.background`.
The override flows through `resolveTheme` and the preview shows the new colour — without
this fix, the write went to a path the resolver doesn't read.

**Independent Test**: `tests/use-theme-editor.test.tsx` — call
`setComponentProperty("button.primary", "background", value)`, assert the working theme
has the override at `pm.button.primary.background`.

### User Story 3 — Per-mode CI gate (Priority: P2)

CI script calls `lintAllModesWithPolicies(theme, [brandGuard])` and gates on the union of
warnings across every declared mode. One line replaces a manual per-mode loop.

**Independent Test**: `tests/policy-packs.test.ts` — `lintAllModesWithPolicies` returns
one entry per declared mode; each carries the pack's emit + the built-in set.

### Edge Cases

- **Single-segment role name** (`card`, `disclosure`): `setComponentProperty("card",
  "background", …)` writes to `pm.card.background`. Verified.
- **Dotted role name** (`button.primary`): writes to `pm.button.primary.background`.
  Verified.
- **`warning()` with `undefined` measured / threshold**: fields are absent on the emitted
  warning (not `0`).
- **`POLICY_RULE_ERROR` runtime emit**: no `measured` / `threshold` keys on the object.

---

## Requirements *(mandatory)*

- **FR-001**: `LintCode` MUST include `POLICY_RULE_ERROR`.
- **FR-002**: `LintWarning.measured` and `LintWarning.threshold` MUST be optional.
- **FR-003**: The runtime's `POLICY_RULE_ERROR` emit MUST omit `measured` / `threshold`.
- **FR-004**: `warning()` MUST pass through `undefined` for absent `measured` /
  `threshold` rather than substituting `0`.
- **FR-005**: `useThemeEditor.setComponentProperty(role, property, value)` MUST write
  under `pm.<role>.<property>`. Dotted role names MUST split into segments correctly.
- **FR-006**: `ThemeEditorState` MUST expose `changedComponentPaths: ReadonlySet<string>`.
  `dirty` MUST derive from `changedTokenIds.size > 0 || changedComponentPaths.size > 0`.
- **FR-007**: The path-classifier MUST treat the second segment of `pm.<x>.…` paths as a
  component-role top iff `x` matches a `COMPONENT_ROLES` entry's first segment.
- **FR-008**: `lintAllModesWithPolicies(theme, packs)` MUST mirror `lintAllModes`'s
  return shape (`{ mode, warnings }[]` per declared mode).

---

## Success Criteria *(mandatory)*

- **SC-001**: `packages/core/tests/policy-packs.test.ts` adds 7 tests covering
  `POLICY_RULE_ERROR`'s optional fields, `warning()` arity variants, and
  `lintAllModesWithPolicies` symmetry / pack composition / no-pack equivalence.
- **SC-002**: `packages/builder/tests/use-theme-editor.test.tsx` adds 3 tests covering
  the component-override write path (correct location + dirty + dotted role + single
  role).
- **SC-003**: Core grows to **68 tests** (was 61); builder to **34 tests** (was 31).
- **SC-004**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across **22 projects** (no new package).
- **SC-005**: Docs touched: `advisory-lint` adds `POLICY_RULE_ERROR` to Diagnostics;
  `policy-packs` notes the optional measured/threshold + `lintAllModesWithPolicies`;
  `builder` notes `changedComponentPaths` + corrected `setComponentProperty` semantics.

---

## Assumptions

- The four gaps are surgical, not architectural. The first three (lint code, optional
  fields, component-override path) are bugs; the fourth (helper) is symmetry. None
  reshape the surface.
- `LintCode` stays a closed union for built-in codes only. Project-local packs continue
  to pass through `CustomLintCode` as before.
- The component-override path fix isn't a breaking change in practice — any FI relying on
  the old behaviour was silently failing (the override never took effect). Migrating from
  the broken behaviour to the working one is the upgrade.
- `changedComponentPaths` is a small additive change to `ThemeEditorState`. Consumers
  that only read `changedTokenIds` still compile.
- The hardening pass intentionally stops here. Severity axis, alpha-color normalisation,
  and component-property editors in `ThemeEditorRoot` are scope creep — captured as
  future cycles, not this PR.
