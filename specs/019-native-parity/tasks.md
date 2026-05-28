---

description: "Task list for Spec S — Cross-adapter native codegen parity"
---

# Tasks: Cross-Adapter Native Codegen Parity

**Input**: Design documents from `specs/019-native-parity/`.

## Phase 1: Setup

- [x] T001 `packages/native-parity/package.json`: name `@polymorph/native-parity`, deps `@polymorph/spec` + the three native adapters; devDeps `@types/node`, `vitest`; scripts `build`, `typecheck`, `test`.
- [x] T002 Add `@polymorph/native-parity` path mapping in `tsconfig.base.json`.
- [x] T003 `tsconfig.json` (build, `paths:{}`), `tsconfig.typecheck.json` (`noEmit`, base path mappings, include src+tests), `vitest.config.ts` (node env, `tests/**/*.test.ts`).

## Phase 2: Normalized value model (US1, P1)

- [x] T004 `src/types.ts`: `NormalizedValue` discriminated union covering all seven Polymorph DTCG types (color / dimension / number / duration / cubicBezier / typography / shadow), with surface-noise erased (lowercase hex, canonical px, ms, numeric font-weight).
- [x] T004b `src/types.ts`: `NormalizedSnapshot` alias for `Map<string, NormalizedValue>`.

## Phase 3: Parsers (US1)

- [x] T005 `src/parse-dart.ts`: parses `static const <Type> <name> = <literal>;` entries; handles Color / double (dimension vs. number disambiguated by name prefix `opacity*`) / Duration (ms or seconds) / Cubic / TextStyle / List<BoxShadow>. Explicit nested pattern for `BoxShadow(color: Color(0x…), offset: Offset(X, Y), …)`.
- [x] T006 `src/parse-swift.ts`: parses `public static let <name>: <Type> = <literal>` entries; converts Color 0…1 channels back to integer hex; converts `TimeInterval` (seconds) to ms; maps `.regular`/`.semibold`/etc. to numeric weight; handles multi-line `PolymorphTextStyle` and `[PolymorphShadow]` literals via lookahead that omits `|$` (would truncate under `m`).
- [x] T007 `src/parse-kotlin.ts`: scopes parsing to the `object <Name> { ... }` body (so helper-struct `val` lines don't pollute); parses `val <name>: <Type> = <literal>`; converts `Dp`/`TextUnit` via `.dp`/`.sp` suffix stripping; converts `Int` ms passthrough; maps `FontWeight.W<N>` to numeric weight.

## Phase 4: Diff (US1)

- [x] T008 `src/diff.ts`: `diffSnapshots(left, right)` returns `ParityMismatch[]`; per-kind comparator uses an `epsilon` of `1e-9` for floats to absorb tiny floating-point noise. Returns empty array on full parity.

## Phase 5: Barrel + tests

- [x] T009 `src/index.ts` barrel re-exporting parsers, diff, types.
- [x] T010 `tests/parity.test.ts`: 18 tests — 12 pairwise parity assertions (3 pairs × 4 fixtures), 4 name-coverage checks (one per fixture), 2 diff-invariant tests (identity + light/dark differs but agrees on dimensions/motion/opacity).

## Phase 6: Docs + polish

- [x] T011 `packages/native-parity/README.md`: why, what it normalises, programmatic surface, regex edges (Kotlin object-body scoping, `|$` removal under `m`, nested-paren shadow), how the test runs, when this fires.
- [x] T012 `docs/reference/packages.md` + root `README.md`: mention the new package, bump project count to **20**.
- [x] T013 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **20 projects**.

## Notes

- The codegens' output formats are deterministic and line-oriented by design — regex is the
  right tool. The two non-obvious edges (Kotlin `data class` lines pollute matches without
  object-body scoping; `|$` under `m` truncates multi-line literals) are documented in the
  README so future maintainers don't relearn them.
- Swift's 4-decimal color precision round-trips cleanly for every value in the two mock-bank
  fixtures. If a future fixture introduces a channel that rounds the wrong way, fix is to
  bump Swift's precision and re-verify both adapters' goldens + this parity check.
- The parity check is **above** per-adapter goldens, not a replacement. Per-adapter goldens
  catch language-level shape regressions; parity catches semantic divergence across the three.
- Adding a fifth fixture (a new mock bank, a new mode) is a one-line addition. The parsers
  are fixture-agnostic.
