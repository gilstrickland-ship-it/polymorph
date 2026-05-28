# Feature Specification: Cross-Adapter Native Codegen Parity

**Spec ID**: 019-native-parity

**Created**: 2026-05-28

**Status**: Implemented

**Input**: Each native codegen (`@polymorph/adapter-{flutter,swift,kotlin}`) carries its own
per-language goldens — committed Dart / Swift / Kotlin output that CI regenerates and diffs.
Those catch language-level regressions (a comma, a `;`). They don't catch **cross-adapter
divergence**: if Swift drifts its color-channel precision, durations, or weight mapping, all
three per-adapter goldens still pass but the converters now emit semantically different
values for the same theme. This spec adds the cross-adapter bar.

---

## Overview

`@polymorph/native-parity` parses each native codegen's output back into a normalized
per-token form (`Map<TokenName, NormalizedValue>`) and asserts the three converters emit
semantically identical token values across the two mock-bank fixtures × `light`/`dark` modes.

Each parser is regex-based — the codegens emit deterministic, line-oriented output by design,
so regex is the right tool. The normalized form erases language-specific surface noise (Swift
0…1 RGB channels, Kotlin `f.dp`/`f.sp` suffixes, Dart `Duration(seconds:)` form, FontWeight
enums in all three flavours) so token-level equivalence is decidable.

---

## Clarifications

### Session 2026-05-28

- Q: Where does the parity check live — in `@polymorph/conformance`, or its own package? → A:
  **Its own package.** Conformance already builds the cross-adapter assertion shape; the
  parity check is conceptually similar but its dependencies (the three native adapters) are
  specific. Keeping it separate avoids pulling adapter-flutter/swift/kotlin into conformance's
  dep graph.
- Q: How do we handle Swift's 4-decimal channel precision losing data? → A: Round-trip
  validation. The Swift converter emits `(n / 255).toFixed(4)`; the parser parses that float
  and rounds `value * 255`. Every bank-fixture color survives the round-trip — we've
  hand-verified for all four fixtures.
- Q: How do we handle Dart's `Duration(milliseconds:)` vs `Duration(seconds:)` ambiguity? → A:
  The parser accepts both forms and normalises to milliseconds (`ms * 1000` for seconds).
  Swift's `TimeInterval` is parsed as seconds and rounded to ms (avoids `0.22 * 1000 = 220.000…
  03`).
- Q: How do we scope Kotlin parsing past the `data class PolymorphTextStyle { val font:
  Font; ... }` block at the top? → A: Slice the `object <Name> { ... }` body first; parse
  only its contents.
- Q: Lazy regex `[\s\S]+?` with `(?=...|$)` under the `m` flag terminates at end-of-line —
  truncating multi-line literals. Fix? → A: Drop the `|$` alternative; rely on the next
  `val` / `// endregion` / `}` always being present in well-formed output. Swift and Kotlin
  parsers both fix this; Dart's `;`-terminated literals don't hit it.
- Q: What about nested `Color(...)` inside `BoxShadow(...)`? Dart's `BoxShadow\(([^)]+)\)`
  stops at the first `)`. → A: Replaced with an explicit pattern that names every
  sub-component (`color: Color(0x…), offset: Offset(X, Y), blurRadius: B, spreadRadius: …`).
  Swift / Kotlin parsers were already explicit.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A native converter drifts (Priority: P1)

A maintainer changes Swift's color-channel precision from 4 decimals to 6 (say, to "preserve
more colour fidelity"). Per-adapter goldens regenerate and pass. The parity test rounds
`(value * 255)` and detects that one channel now rounds to `0x1E` instead of `0x1F` while
Dart and Kotlin still emit `0x1F`. The PR is flagged: either revert, or coordinate the
change across all three converters.

**Independent Test**: `tests/parity.test.ts` — 12 pairwise assertions (3 pairs × 4 fixtures)
plus 4 name-coverage checks + 2 diff-invariant checks = 18 tests.

### User Story 2 — A new token type lands in the manifest (Priority: P2)

Adding `pm.color.feedback.info.bg` to the manifest. The three native adapters each emit a
constant for it. The parity test asserts all three snapshots cover the same token names; if
one adapter forgets to emit the new constant, the name-coverage check fails.

### Edge Cases

- **Multi-line literals** — `TextStyle(...)` (Dart), `PolymorphTextStyle(...)` (Swift /
  Kotlin), `listOf(PolymorphShadow(...), ...)` (Kotlin) all span multiple lines. Parsers use
  lazy matches with safe lookaheads (no `|$` under `m`).
- **Nested parens in shadow literals** — Dart's `BoxShadow(color: Color(0xFF...), offset:
  Offset(X, Y), ...)` requires an explicit pattern; the naive `[^)]+` approach truncates at
  the inner `Color(...)` close.
- **Light vs. dark of the same bank** — should differ in colors but agree on dimensions /
  motion / opacity. The diff-invariant test confirms this directly via the parity package's
  own `diffSnapshots`.

---

## Requirements *(mandatory)*

- **FR-001**: A new workspace package `@polymorph/native-parity` MUST exist at
  `packages/native-parity/` with deps on the three native adapters and `@polymorph/spec`.
- **FR-002**: `parseDart(source)`, `parseSwift(source)`, `parseKotlin(source)` MUST each
  return a `NormalizedSnapshot` (`Map<TokenName, NormalizedValue>`).
- **FR-003**: `NormalizedValue` MUST canonicalise away surface differences: colors as
  lowercase `#rrggbb` hex (alpha stripped); dimensions as `px` numbers; durations as
  `ms` numbers; font weights as numeric `100..900`; typography composites as
  `{ family, weight, fontSizePx, lineHeight, letterSpacingPx }`; shadows as
  `{ hex, xPx, yPx, blurPx }[]`.
- **FR-004**: `diffSnapshots(a, b)` MUST return an array of `ParityMismatch`
  (`{ name, left, right }`) entries; empty array = parity.
- **FR-005**: The Kotlin parser MUST slice the `object <Name> { … }` body before extracting
  tokens, so helper-struct lines (`val font: Font` etc. inside the inlined
  `data class PolymorphTextStyle`) don't pollute results.
- **FR-006**: Literal-termination lookaheads in the Swift and Kotlin parsers MUST NOT include
  `$` as an end-of-input alternative under the `m` flag (truncates multi-line literals).
- **FR-007**: Dart's shadow parser MUST use an explicit nested pattern, not `BoxShadow\(
  ([^)]+)\)` (the inner `Color(0x…)` stops the naive match early).
- **FR-008**: The parity test MUST run all three pairwise comparisons (dart↔swift,
  dart↔kotlin, swift↔kotlin) for every bank × mode fixture.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/parity.test.ts` — 18 tests passing: 12 pairwise parity assertions +
  4 name-coverage checks + 2 diff-invariant tests.
- **SC-002**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across the new project count (**20**).
- **SC-003**: Docs `reference/packages.md` and root `README.md` updated to mention the new
  package and the new project count.

---

## Assumptions

- The native codegens' output formats are deterministic and line-oriented by design.
  Materially changing one would require updating the corresponding parser in lock-step — a
  reasonable cost for the divergence guarantee the parity check provides.
- The 4-decimal Swift color precision round-trips cleanly for every value in the two
  mock-bank fixtures. If a future bank fixture introduces a channel value where the
  4-decimal form rounds the wrong way (off-by-one), the fix is to bump Swift's channel
  precision and re-verify.
- The parity check operates on the two bank fixtures × 2 modes. Adding more fixtures (a new
  mock bank, a new mode) is a one-line addition; the parser code is fixture-agnostic.
- Per-adapter goldens stay authoritative for language-level shape. The parity check is the
  cross-adapter bar above them, not a replacement.
