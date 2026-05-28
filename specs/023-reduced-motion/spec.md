# Feature Specification: Reduced-Motion Contract Extension

**Spec ID**: 023-reduced-motion

**Created**: 2026-05-28

**Status**: Implemented

**Input**: The advisory lint guide already flagged motion-reduce as a known gap: the
contract carried full-strength motion durations but nothing reduced-motion-aware. Hosts
that wanted to honour `prefers-reduced-motion: reduce` either authored bespoke per-project
overrides or — more commonly — skipped the work because the contract didn't acknowledge
the axis. This spec adds the two tokens, the runtime clamp, the Web `@media` block, and
the advisory lint to close that gap.

---

## Overview

Two new contract tokens, one pure transform in `@polymorph/core`, one Web adapter helper,
one advisory lint rule, one docs page. No new package.

| Surface | What it does |
|---|---|
| `pm.motion.duration.reduced` (required) | The clamp value. Every motion duration collapses to this when reduced motion is on. |
| `pm.motion.easing.reduced` (optional) | The clamp easing. Defaults to linear (`[0,0,1,1]`) when absent. |
| `applyReducedMotion(resolved)` (core) | Pure, idempotent, non-mutating transform: returns a new `ResolvedTheme` with every motion duration + easing replaced by the clamp values. Walks both `tokens` and `components` blocks. |
| `toReducedMotionMediaBlock(resolved)` (Web adapter) | Returns just the `@media (prefers-reduced-motion: reduce)` block — only the variables that change under the clamp. |
| `toCssVariablesString(...)` default emit | Includes the media block by default; pass `reducedMotion: "off"` to opt out (orgs that clamp in JS via `applyReducedMotion`). |
| `MOTION_REDUCED_EXCEEDS_SHORT` (lint) | Warns when the reduced clamp is longer than `pm.motion.duration.short` — the clamp is meant to be the *fastest* available motion. |

---

## Clarifications

### Session 2026-05-28

- Q: Per-token reduced companions or one global clamp? → A: **One clamp.** OS-level
  reduced-motion is binary; per-component tuning belongs in product code, not the design
  system. Two tokens (duration + easing) cover every motion type the contract carries.
- Q: Required or optional? → A: **`reduced` duration required; `reduced` easing optional
  with a linear default.** Required makes the lint rule reliable and forces every theme
  author to decide a clamp value; optional easing keeps the migration footprint small.
- Q: Where to apply the clamp — codegen, runtime, or both? → A: **Runtime transform in
  core; Web adapter additionally emits a CSS @media block as a no-JS path.** Native
  adapters get the clamp via the host calling `applyReducedMotion` before passing the
  theme to the codegen — toolchain-uniform preference queries don't exist on iOS / Android
  / Flutter the way `@media` exists on Web.
- Q: Walk components too? → A: **Yes.** Component blocks resolve duration / cubicBezier
  defaults via `defaultsFrom`; the clamp walks them and replaces values that structurally
  match a duration or cubicBezier. Keeps adapter codegen consistent without the adapter
  needing to know which component slots are motion-typed.
- Q: Lint threshold? → A: **`reduced > short`.** Stronger than "non-zero" (FIs choose
  intentional non-zero clamps like 1ms / 50ms for subtle micro-feedback), weaker than
  "must be exactly zero" (which kills accessibility-respecting micro-feedback).
- Q: Validate at the schema or at the lint? → A: **Schema requires presence; lint catches
  the inverted relationship.** Mirrors the rest of the contract's structural-vs-advisory
  split.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — An FI ships reduced-motion support without writing JS (Priority: P1)

The FI authors the two reduced tokens and ships the CSS bundle from
`toCssVariablesString`. The bundled `@media (prefers-reduced-motion: reduce)` block kicks
in automatically; no preference-listener JS required.

**Independent Test**: `tests/reduced-motion.test.ts` — emits the media block, asserts it
contains motion variables only (no `--pm-color-*` / `--pm-space-*`).

### User Story 2 — A native runtime swaps the theme at the preference flip (Priority: P1)

The host reads the OS preference (`UIAccessibility.isReduceMotionEnabled`,
`Settings.Global.ANIMATOR_DURATION_SCALE`, `MediaQuery.disableAnimations`), calls
`applyReducedMotion`, and re-renders.

**Independent Test**: `tests/reduced-motion.test.ts` — `applyReducedMotion` clamps every
motion duration + easing; idempotent; non-mutating; defaults easing to linear when absent.

### User Story 3 — An author tries to set the clamp longer than `short` (Priority: P2)

The lint warns `MOTION_REDUCED_EXCEEDS_SHORT` — the clamp is supposed to be the fastest
available, not slow micro-interactions further.

**Independent Test**: `tests/reduced-motion.test.ts` — lint warns on a 500ms `reduced`
when `short` is shorter.

### Edge Cases

- **`pm.motion.duration.reduced` missing**: `applyReducedMotion` returns the input
  unchanged (schema validation catches the missing required token elsewhere; the transform
  is intentionally loose on partial themes).
- **`pm.motion.easing.reduced` missing**: easings clamp to linear `[0, 0, 1, 1]`.
- **Idempotence**: `applyReducedMotion(applyReducedMotion(x))` === `applyReducedMotion(x)`.
- **Non-mutation**: input theme JSON is unchanged after the transform.

---

## Requirements *(mandatory)*

- **FR-001**: The semantic vocabulary MUST include `pm.motion.duration.reduced` (required,
  duration, invariant) and `pm.motion.easing.reduced` (optional, cubicBezier, invariant).
- **FR-002**: `@polymorph/core` MUST export `applyReducedMotion(resolved)` — pure,
  idempotent, non-mutating. Returns the input unchanged when
  `pm.motion.duration.reduced` is absent.
- **FR-003**: `applyReducedMotion` MUST walk both `tokens` (by id prefix) and `components`
  (by structural shape match) and replace every duration + cubicBezier value with the
  clamp.
- **FR-004**: `@polymorph/adapter-web` MUST export `toReducedMotionMediaBlock(resolved,
  selector?)` returning a CSS string containing ONLY the variables that change under the
  clamp.
- **FR-005**: `toCssVariablesString` MUST include the media block by default; an option
  `{ reducedMotion: "off" }` MUST suppress it for orgs that clamp in JS.
- **FR-006**: `@polymorph/core`'s `lintTheme` MUST emit `MOTION_REDUCED_EXCEEDS_SHORT`
  when `pm.motion.duration.reduced` > `pm.motion.duration.short`.
- **FR-007**: Every existing fixture + bank example MUST include the new required token.
  Native goldens MUST regenerate to embed the new constant.

---

## Success Criteria *(mandatory)*

- **SC-001**: `packages/core/tests/reduced-motion.test.ts` — 8 tests (6 transform
  behaviour + 2 lint).
- **SC-002**: `packages/adapter-web/tests/reduced-motion.test.ts` — 5 tests (media block
  shape + selector override + opt-out + clamped values).
- **SC-003**: Cold-state `nx run-many -t build typecheck test conformance
  --skip-nx-cache` green across **20 projects** (no new package).
- **SC-004**: New docs page `/guide/reduced-motion` shipped; `/guide/advisory-lint`
  updated with the new code; sidebar entry added; the prior "Motion-reduce media query
  coverage" limitation removed from the lint page.
- **SC-005**: Native adapter goldens regenerated and committed (`aurora_{light,dark}`,
  `borealis_{light,dark}` for Dart / Swift / Kotlin) embedding the new constant.

---

## Assumptions

- Authoring tools (Tokens Studio, Figma Variables importer) treat the new token as a
  normal `duration`; no importer changes required other than mapping fixtures gaining
  the new id.
- Hosts that already implement their own reduced-motion logic can ignore the contract
  tokens — the runtime transform + Web @media block are opt-in via standard call-sites.
- The "one clamp" model is the right granularity. Per-component reduced-motion overrides
  belong in product code; the contract carries one knob.
- Animation cancellation is out of scope — the clamp shortens upcoming animations but
  doesn't interrupt in-flight ones. That's a host concern.
