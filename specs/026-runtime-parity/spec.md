# Feature Specification: Cross-Adapter Runtime Parity

**Spec ID**: 026-runtime-parity

**Created**: 2026-05-29

**Status**: Implemented

**Input**: `@polymorph/native-parity` asserted the three native codegens agreed *with each
other*. That catches divergence between Dart and Swift but doesn't catch "all three wrong
in the same way". This spec extends the package to assert every adapter — including Web —
agrees with a baseline computed directly from `resolveTheme`, the contract's source of
truth.

---

## Overview

`@polymorph/native-parity` (kept the package name; expanded scope) gains:

| Surface | Purpose |
|---|---|
| `normalizeResolved(rt, opts?)` | Normalise a `ResolvedTheme` into the same `NormalizedSnapshot` shape the native parsers produce. Optional `includeComponents` covers role-flat constants. |
| `roleToCamelName(role, property)` | `button.primary` + `background` → `buttonPrimaryBackground`. Matches the native adapters' flat naming. |
| `parseCssVars(vars)` | Parse the Web adapter's `toCssVariables` output back into a `NormalizedSnapshot`. Groups typography sub-vars back into composites. |
| `checkRuntimeParity(theme, mode)` | Compute baseline + every adapter's snapshot, return per-adapter mismatch lists. |
| `assertRuntimeParity(theme, mode, label?)` | Throws a readable cross-adapter diff when any adapter disagrees. |

The Web adapter only checks the token subset of the baseline (it doesn't emit component-role
flat vars — those are consumed through React props at the call site). Native adapters check
the full baseline including components.

---

## Clarifications

### Session 2026-05-29

- Q: New package or extend `@polymorph/native-parity`? → A: **Extend.** The normalisation
  + diff infrastructure already lives in native-parity; adding the Web CSS-vars parser and
  the core-baseline path keeps it tight. Package name stays for compatibility; the
  description bumps to reflect the broader scope.
- Q: Do Web + native check the same baseline? → A: **No — scoped per adapter.** Web emits
  tokens only (no component-role flat vars); native emits both. `normalizeResolved` takes
  an `includeComponents` option so each adapter diffs against the appropriate subset.
- Q: Parse format for CSS values? → A: **Per-property heuristic.** Color (`#…`), duration
  (`Nms` / `Ns`), cubic-bezier (`cubic-bezier(...)`), dimension (`Npx` / `Nrem` / `Nem` —
  unit *required*), bare number. Typography sub-vars merge by base-name into one composite
  entry.
- Q: Shadows in the Web adapter? → A: **Parse the comma-separated `<ox> <oy> <blur>
  <spread> <color>` form.** Multi-shadow stacks split at top-level commas (parens-aware).
- Q: Component-property type inference (no `$type` on resolved component values)? → A:
  **By shape.** Hex string → color; `{value, unit}` → dimension/duration; 4-number array →
  cubicBezier; etc. Matches what the codegens already do internally.
- Q: How does the test demonstrate it works as a guard, not just an always-green check?
  → A: **Two deliberately-tampered tests.** One drops a CSS variable, one rewrites a Dart
  constant; both assert the diff catches it with readable mismatch entries.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Catching codegen drift from core (Priority: P1)

A new Web adapter feature accidentally rounds a value differently than the core resolver.
CI's runtime parity check fails with a per-adapter diff showing the divergent token name +
both sides' values.

**Independent Test**: `tests/runtime-parity.test.ts` — banks × modes pass parity on every
adapter; deliberately-tampered fixtures fail with the right mismatch list.

### User Story 2 — Verifying a new bank theme (Priority: P1)

An FI's CI imports `assertRuntimeParity` and asserts no adapter disagrees with core on the
new theme. Catches both adapter bugs and theme-shape bugs that resolve fine but emit
incorrectly downstream.

**Independent Test**: covered by the bank-fixture loop.

### Edge Cases

- **Web adapter doesn't emit component-role vars**: per-adapter scoping ensures Web's diff
  excludes component keys from the baseline.
- **Typography composites round-trip**: five CSS sub-vars recombine into one composite
  entry that matches the baseline's typography shape.
- **Bare numbers vs. dimensions**: `0.4` parses as `number`, not `0.4px` dimension —
  required regression check (without it, opacity tokens mis-classify).

---

## Requirements *(mandatory)*

- **FR-001**: `normalizeResolved` MUST emit camelCase keys matching the native parsers'
  naming convention.
- **FR-002**: `parseCssVars` MUST round-trip every token type the Web adapter emits
  (color, dimension, number, duration, cubicBezier, typography, shadow).
- **FR-003**: `parseCssVars` MUST treat bare numbers (no unit suffix) as the `number`
  kind, not `dimension`.
- **FR-004**: `checkRuntimeParity` MUST scope the baseline per adapter — Web sees tokens
  only; native sees tokens + component-role flat constants.
- **FR-005**: `assertRuntimeParity` MUST throw a readable error listing the divergent
  token names per adapter with baseline + got values.
- **FR-006**: Adding the new surface MUST NOT break the existing pair-wise native parity
  tests.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/runtime-parity.test.ts` — 14 tests (normalize + parse-css-vars
  round-trip + per-bank-per-mode runtime parity + tamper-detection guards).
- **SC-002**: `packages/native-parity` total **32 tests** (was 18; +14 new).
- **SC-003**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across **21 projects** (no new package).
- **SC-004**: New docs page `/guide/runtime-parity` shipped; package row in
  `reference/packages.md` updated; sidebar entry added.

---

## Assumptions

- The native-parity package name stays (extending scope, not splitting). The description
  updates; consumers don't break.
- Component-role flat constants are a native-only emission today. If Web adopts a
  flat-emission mode later (e.g. `--pm-button-primary-background`), the per-adapter scope
  gets a `web-css-full` option without changing the surface.
- The Web adapter's CSS output is the only surface; `provider.tsx`'s React API isn't part
  of the parity check. Framework-level tests cover the React binding separately.
- `parseCssVars` is best-effort tolerant. Unknown values are dropped silently — the
  baseline-side diff surfaces them as `baseline=...; got=undefined`.
- Tampered-fixture tests demonstrate the guard works. CI gates on both runtime parity and
  the existing pair-wise check; either failing is a build-stop.
