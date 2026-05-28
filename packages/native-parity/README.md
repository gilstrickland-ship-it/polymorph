# @polymorph/native-parity

Cross-adapter parity check for the three native codegens — Dart (`@polymorph/adapter-flutter`),
Swift (`@polymorph/adapter-swift`), and Kotlin (`@polymorph/adapter-kotlin`). Parses each
generated source back into a normalized per-token form and asserts the three converters emit
**semantically identical token values** for the same input theme.

## Why

Each native adapter has its own per-language goldens (committed Dart / Swift / Kotlin output
that CI regenerates and diffs). Those catch language-level regressions (a comma here, a `;`
there). They don't catch **cross-adapter divergence**: if the Swift converter rounds a duration
to 0.220 seconds but Kotlin emits 220 ms and Dart emits `Duration(milliseconds: 219)`, the
per-adapter goldens still pass — each is internally consistent — but a vendor who generates
both Dart and Swift from the same theme is now shipping two different behaviours.

This package is the cross-adapter bar that catches that. It runs all three codegens on the
two mock-bank fixtures across `light` / `dark`, normalises each output, and asserts pairwise
equivalence (dart ≡ swift ≡ kotlin) per token.

## What it normalises away

| Surface noise | Normalised form |
|---|---|
| Swift's `Color(red: 0.1216, green: 0.3608, blue: 1)` (0…1 channels, trailing zeros stripped) | `#1f5cff` hex (lowercase, no alpha) |
| Dart / Kotlin `Color(0xFF1F5CFF)` (alpha forced FF) | `#1f5cff` |
| Dart `Duration(milliseconds: 220)` / `Duration(seconds: 1)` | `220` / `1000` (ms `number`) |
| Swift `TimeInterval = 0.22` (seconds) | `220` (ms, rounded) |
| Kotlin `Int = 220` (already ms) | `220` |
| Kotlin `8.0f.dp`, `16.0f.sp` (dp / sp suffixes) | `8.0`, `16.0` (px `number`) |
| Swift `.semibold`, Dart `FontWeight.w600`, Kotlin `FontWeight.W600` | `600` (numeric weight) |
| Multi-line `TextStyle(...)` / `PolymorphTextStyle(...)` / `PolymorphTextStyle(...)` literals | one struct: `{ family, weight, fontSizePx, lineHeight, letterSpacingPx }` |
| Single-shadow vs. multi-shadow array forms | one `{ hex, xPx, yPx, blurPx }[]` |

## Programmatic surface

```ts
import {
  parseDart,
  parseSwift,
  parseKotlin,
  diffSnapshots,
  type NormalizedSnapshot,
  type ParityMismatch,
} from "@polymorph/native-parity";

const dart = parseDart(dartSource);    // Map<tokenName, NormalizedValue>
const swift = parseSwift(swiftSource);
const kotlin = parseKotlin(kotlinSource);

const mismatches: ParityMismatch[] = diffSnapshots(dart, swift);
// [] when the two snapshots agree.
```

Each parser is regex-based — the codegens emit deterministic, line-oriented output by design,
so regex is the right tool. Two edges worth knowing about:

1. The Kotlin parser scopes itself to the `object <Name> { ... }` body so it doesn't pick up
   the `val font: Font` etc. lines inside the helper `data class PolymorphTextStyle` block at
   the top of the file.
2. The literal-termination lookahead omits the `$` end-of-line alternative — under the `m`
   flag, `$` matches end-of-line, which prematurely truncates multi-line literals
   (`PolymorphTextStyle(...)`, `listOf(PolymorphShadow(...), ...)`).

## How the test runs

```ts
for (const fixture of [{aurora,borealis} × {light,dark}]) {
  const dart   = parseDart(transformToDart(fixture.theme, { mode }));
  const swift  = parseSwift(transformToSwift(fixture.theme, { mode }));
  const kotlin = parseKotlin(transformToKotlin(fixture.theme, { mode }));

  expect(diffSnapshots(dart, swift)).toEqual([]);
  expect(diffSnapshots(dart, kotlin)).toEqual([]);
  expect(diffSnapshots(swift, kotlin)).toEqual([]);
}
```

Four fixtures × three pairwise comparisons = 12 parity assertions, plus a name-coverage check
per fixture (all three snapshots cover the same token names) and two diff-invariant tests.
**18 tests total.**

## When this fires

The check fires when one converter changes its emit format without the others catching up.
Examples that would have been caught:

- Swift's color-channel precision changes from 4 decimals to 6 (rounded ints differ).
- Kotlin's `dp` extension swaps argument types from `Float` to `Int` (literal shape changes).
- Dart starts emitting `Duration(microseconds: …)` for sub-millisecond values.
- Any converter starts skipping a token type that the other two emit.

When it fires, the failing test prints up to five mismatches with both sides' normalized
values, so the source of divergence is immediate.

> Implemented in **Spec S — Cross-adapter native codegen parity**.
