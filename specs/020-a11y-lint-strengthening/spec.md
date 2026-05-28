# Feature Specification: A11y Linter Strengthening

**Spec ID**: 020-a11y-lint-strengthening

**Created**: 2026-05-28

**Status**: Implemented

**Input**: The advisory linter in `@polymorph/core` shipped in Spec B with two narrow
contrast checks (body-on-base, onAction-on-primary.rest), a touch-target gate, and a
disabled-opacity gate. That's enough to *demonstrate* the contract's a11y posture but not
enough to *enforce* it: a theme can pass `lintTheme` while shipping invisible focus rings,
illegible feedback colours, or low-contrast secondary actions. This spec broadens the linter
into a manifest-driven, contract-strength gate.

---

## Overview

`lintTheme` now derives its checks from the contract manifest (`TOKENS` + `COMPONENT_ROLES`)
rather than from a hand-listed pair of tokens. Eight rule families cover:

- **Text on every named surface** — body / muted / link / disabled across surface.base / raised /
  sunken / overlay (and onInverse / surface.inverse as a separate pair).
- **`onAction` across every actionable background** — primary / secondary / danger × rest /
  hover / pressed.
- **Feedback accents** — success / warning / error / info as text on surface.base.
- **Focus ring + default border** — non-text 3:1 against surface.base (SC 1.4.11).
- **Component fg/bg** — per role's resolved (override-applied) values.
- **Touch target / disabled opacity / motion base** — perceptual gates from semantic ids.

Plus a new `lintAllModes(theme)` convenience for CI gates that want one pass to cover every
declared mode.

Backwards-compatible: every existing code (`CONTRAST_TEXT_LOW`, `CONTRAST_ON_ACTION_LOW`,
`TOUCH_TARGET_SMALL`, `DISABLED_OPACITY_HIGH`, `CONTRAST_SKIPPED_UNPARSEABLE`) still fires on
its original condition; new families add new codes. CLI behaviour unchanged.

---

## Clarifications

### Session 2026-05-28

- Q: Where to draw the threshold for `text.disabled`? → A: **WCAG AA Large (3.0)**, not text
  (4.5). Disabled text is intentionally suppressed; pushing it to 4.5 would force every theme
  to override `text.disabled` for non-perceptual reasons. 3.0 catches the *truly* invisible
  case while leaving designer judgment intact.
- Q: How to handle "outline button" patterns that deliberately use body text on a neutral
  fill (scoring ~3.2:1)? → A: **Flag advisory; don't gate.** The linter is advisory by
  contract (Constitution VI); FIs that need a hard gate use `--strict` *and* can filter codes
  via the JSON output if they accept specific families. Our Aurora fixture exercises this
  exact pattern; the warning fires and the test acknowledges it as expected.
- Q: Add a motion-reduce rule? → A: **Partial — a `MOTION_BASE_LONG` gate** for
  `motion.duration.base` > 500ms (perceptually disorienting as a default in-flow timing). A
  full `prefers-reduced-motion` token family would be a contract change, out of scope here.
- Q: Lint every mode automatically, or per-mode? → A: **Existing `lintTheme(rt)` stays
  per-mode** (preserves the symmetry with `resolveTheme`). Add `lintAllModes(theme)` as a
  convenience that calls `resolveTheme` for each declared mode and returns
  `{ mode, warnings }[]`.
- Q: Component-token rules — how to know which roles have a fg/bg pair? → A: Read
  `COMPONENT_ROLES` from the manifest at runtime; if both `foreground` and `background`
  exist, the pair is checked. Border-only roles (`border` + `background`, no `foreground`)
  use the 3.0 non-text threshold.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A theme ships an invisible focus ring (Priority: P1)

The FI's brand team picks `#e9e9e9` for `pm.color.border.focus` (a subtle on-white grey). The
linter computes `1.07:1` on `surface.base` and fires `FOCUS_RING_LOW` — a clear, well-known
WCAG SC 1.4.11 failure that's invisible to the previous two-rule linter.

**Independent Test**: `tests/lint.test.ts` — `flags an invisible focus ring` (sets
`border.focus` to a near-surface value; asserts `FOCUS_RING_LOW` fires with threshold 3.0).

### User Story 2 — A bank's secondary button is unreadable (Priority: P1)

Aurora's `button.secondary.foreground` is `text.body` on `action.secondary.rest` (a common
outline pattern). The linter computes `3.2:1` and fires `COMPONENT_CONTRAST_LOW` —
acknowledged in the Aurora fixture's lint output as a known-acceptable advisory. A real bug
(e.g. the foreground was wired to a near-background colour by mistake) would surface as the
same code with a much lower ratio.

**Independent Test**: `tests/lint.test.ts` — `checks component-token fg/bg contrast
independently from semantic-token contrast` (overrides `button.primary` with a low-contrast
pair, asserts `COMPONENT_CONTRAST_LOW` fires).

### User Story 3 — Feedback yellow-on-white (Priority: P1)

`feedback.warning` is often a bright yellow / orange chosen for "warning vibes" without a
contrast check. Renders as text on `surface.base` (form-validation copy) and clocks ~3:1 — not
AA. The linter fires `CONTRAST_FEEDBACK_LOW`.

**Independent Test**: covered by the feedback-low test.

### User Story 4 — CI gate one-shots every mode (Priority: P2)

A CI step that wants to lint every declared mode of a theme. `lintAllModes(theme)` returns
one entry per mode with its warnings; CI fails if any mode has warnings under `--strict`.

### Edge Cases

- **Modes a theme doesn't declare** — `declaredModes` returns only the ones it does;
  `lintAllModes` doesn't run resolution for absent modes (would throw).
- **Unparseable colours** — already handled by `CONTRAST_SKIPPED_UNPARSEABLE`; emitted once
  per affected pair rather than swallowed.
- **Missing optional tokens** — pairs where one side is absent are silently skipped (validate
  catches required gaps; linting absent optionals would be noisy).
- **Component-role with no foreground** — the border-on-background pair is checked instead
  (threshold 3.0).

---

## Requirements *(mandatory)*

- **FR-001**: `lintTheme(rt)` MUST derive its checks from `TOKENS` and `COMPONENT_ROLES` at
  runtime; new tokens / roles added to the manifest MUST be picked up automatically.
- **FR-002**: All existing lint codes (`CONTRAST_TEXT_LOW`, `CONTRAST_ON_ACTION_LOW`,
  `TOUCH_TARGET_SMALL`, `DISABLED_OPACITY_HIGH`, `CONTRAST_SKIPPED_UNPARSEABLE`) MUST keep
  firing on their original conditions.
- **FR-003**: Five new lint codes MUST be added: `CONTRAST_ON_INVERSE_LOW`,
  `CONTRAST_FEEDBACK_LOW`, `DISABLED_TEXT_LOW`, `FOCUS_RING_LOW`, `BORDER_DEFAULT_LOW`,
  `COMPONENT_CONTRAST_LOW`, `MOTION_BASE_LONG`. (Numbering is approximate; the LintCode union
  in `errors.ts` is authoritative.)
- **FR-004**: Thresholds MUST follow WCAG 2.1: text 4.5 (SC 1.4.3), non-text 3.0 (SC 1.4.11),
  AA Large 3.0 for disabled-text. Motion gate at 500ms is local guidance.
- **FR-005**: `lintAllModes(theme)` MUST return one entry per declared mode (via
  `declaredModes`), each `{ mode, warnings }`.
- **FR-006**: Linter MUST remain advisory by contract — never throws, never blocks. The
  `--strict` CLI flag remains the actionable knob.
- **FR-007**: Existing tests MUST keep passing without behavioural drift on body-on-base
  (the previously-most-narrow check is now one assertion inside a broader matrix; tests
  updated to assert specific token pairs).

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/lint.test.ts` — 16 tests passing: 6 backwards-compat (touch-target,
  disabled-opacity, body-on-base specifics) + 10 new (Aurora central-pair pass,
  feedback-low, focus-ring-low, border-default-low, on-inverse-low, disabled-text-low,
  motion-base-long, on-action matrix, component-contrast, `lintAllModes`).
- **SC-002**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across **20 projects** (no new package — strengthening `@polymorph/core` in place).
- **SC-003**: Docs `guide/advisory-lint` rewritten to enumerate every rule family + thresholds
  + the `lintAllModes` convenience.

---

## Assumptions

- The Aurora fixture's existing component-contrast warnings (`button.secondary.foreground`,
  feedback accents on surface.base, faded `text.disabled`) are *known-acceptable advisory
  signals*, not bugs. They demonstrate the linter doing its job; updating the fixture to
  silence them is a separate design decision.
- WCAG 2.1 thresholds are the right baseline. WCAG 2.2 (new 1.4.13 / 2.4.11 / 2.4.13 / 2.5.7
  / 2.5.8) involves form-factor-specific behaviours the linter can't see from tokens alone;
  out of scope.
- The motion-base gate at 500ms is **local guidance**, not WCAG — long base durations are
  perceptually disorienting as a default, but the threshold is judgement, not standard.
- A future spec can layer `MOTION_NO_REDUCED_VARIANT` once the contract adds a
  `motion.duration.reduced.*` family. That's a contract change (additive minor bump) out of
  scope here.
