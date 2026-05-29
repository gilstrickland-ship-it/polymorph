# Report R3 — Adapter coverage & two real bugs found

**Test file**: `tests/integration-primer/tests/02-adapters.test.ts`.
**Specs exercised**: 016 (Web CSS-vars), 026 (cross-adapter runtime parity).
**Reproduce**:
```bash
pnpm --filter @polymorph/integration-primer test 02-adapters
```

**The headline: this report documents TWO real bugs the integration test caught + fixed.**

---

## Method

Run the Primer-derived theme through every shipped adapter:

```ts
toCssVariables(rt)         // Web — CSS custom properties
transformToDart(theme, …)  // Flutter
transformToSwift(theme, …) // iOS / SwiftUI
transformToKotlin(theme, …)// Android / Compose
```

Then assert each adapter's output, parsed back to the normalised form, agrees with a
baseline computed directly from `resolveTheme`.

## Adapter smoke (4 tests)

| Test | Result |
|---|---|
| Web CSS vars: brand colour reaches the output | ✓ `--pm-color-action-primary-rest: #1f883d` |
| Web stylesheet wraps under `:root` + emits `@media (prefers-reduced-motion)` | ✓ both present |
| Dart codegen carries Primer brand green | ✓ `Color(0xFF1F883D, …)` in source |
| Swift codegen carries Primer brand green | ✓ `Color(red: 0.1216, green: 0.5333, blue: 0.2392)` (31/255, 136/255, 61/255) |
| Kotlin codegen carries Primer brand green | ✓ `Color(0xFF1F883D)` |

All four pass.

## Runtime parity (2 tests, the killer findings)

```ts
const results = checkRuntimeParity(theme, "light");
expect(results.every((r) => r.mismatches.length === 0)).toBe(true);
```

**Initial run: FAILED.** 4 mismatches per adapter per mode. All on typography composites.
Drilling in surfaced two distinct bugs.

### Bug R3.1 — `normalizeResolved` typography fontSize didn't convert `rem` → `px`

**Diagnosis**: Primer ships `--base-text-size-md: 1rem`. Our FI mapping passes this
through to `pm.typography.body.fontSize = { value: 1, unit: "rem" }`. The Web adapter
converts to `--pm-typography-body-font-size: 16px` (rem×16). The Dart / Swift / Kotlin
adapters also output `16.0` (the platform-native unit). But the **baseline** computed
from `resolveTheme` reported `{kind:"typography", fontSizePx: 1, …}` — `value` taken
verbatim, no unit conversion.

`normalizeResolved`'s standalone `dimension` token kind DID handle rem (it multiplied by
16). But the `typography` composite path read `fontSize.value` directly, ignoring
`fontSize.unit`. Bug.

**Fix** (in `packages/native-parity/src/normalize-resolved.ts`):

```ts
// Before:
fontSizePx: fontSize.value,

// After:
fontSizePx: toPx(fontSize),

function toPx(v: Record<string, unknown>): number {
  const n = v.value as number;
  switch (v.unit) {
    case "px": return n;
    case "rem":
    case "em": return n * 16;
    default: return n;
  }
}
```

Also applied to `letterSpacing` in the same function.

**Verification**: All 32 existing `@polymorph/native-parity` tests still pass; Primer
integration test now reports the same `fontSizePx` for baseline and every adapter.

### Bug R3.2 — Swift / Kotlin / Dart parsers' fontFamily regex doesn't handle escaped quotes

**Diagnosis**: Primer's Mona Sans stack is:
```
"Mona Sans VF", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"
```

The Swift codegen emits:
```swift
font: Font.custom("\"Mona Sans VF\", -apple-system, …, \"Segoe UI Emoji\"", size: 16)
```

Valid Swift. But the **parity parser regex** to extract the family from generated source:
```ts
literal.match(/font:\s*Font\.custom\("([^"]*)"/)
```

`[^"]*` stops at the **first** `"` it sees. The first `"` after `Font.custom("` is the
escaped one (`\"Mona Sans VF\"`), so the capture group was just `\` — empty family.

Identical regex flaw in `parse-kotlin.ts` (`"([^"]*)"`) and `parse-dart.ts` (`'([^']*)'`).

**Fix**: Match escaped chars correctly. Used in all three parsers:

```ts
// Before (Swift):
/font:\s*Font\.custom\("([^"]*)"/

// After:
/font:\s*Font\.custom\("((?:\\.|[^"\\])*)"/
//                       ^ matches escaped chars (\\, \", etc.) OR non-quote-non-backslash chars
// Then unescape the captured group:
family: m[1]!.replace(/\\(.)/g, "$1"),
```

**Verification**: All 32 existing `@polymorph/native-parity` tests still pass (the old
tests didn't use families with `"` inside). Primer integration test now reports the
correct family string for every native target.

## Why pure unit tests didn't catch these

- The existing native-parity tests use Aurora / Borealis themes whose typography ships
  in `px` and whose `fontFamily` is plain `"Inter"`. Both bugs require **real-world
  input shapes** (rem typography, quoted families) that the bank-fixture generator
  doesn't produce.
- These bugs only manifest under **cross-adapter parity** — emitting CSS / Dart / Swift /
  Kotlin separately and asserting they're equivalent. A single-adapter golden test would
  have shown the Swift output looks correct *and* validated against the wrong baseline,
  hiding both bugs.

This is the case for real-world integration testing with public published packages.

## Runtime parity, after both fixes

```
✓ light: every adapter agrees with the core resolved baseline
✓ dark:  every adapter agrees with the core resolved baseline
```

All 6 adapter tests pass green.

## Summary

| Spec | Status | Notes |
|---|---|---|
| 016 — Web CSS-vars adapter | ✓ green | Brand colour and `@media (prefers-reduced-motion)` block both present |
| 026 — runtime parity | ✓ green **after 2 fixes** | Two real bugs caught + fixed: rem→px in normalizer typography, escaped-quote handling in 3 parsers |

## Files touched by the fixes

- `packages/native-parity/src/normalize-resolved.ts` (+ `toPx` helper)
- `packages/native-parity/src/parse-swift.ts` (regex + unescape)
- `packages/native-parity/src/parse-kotlin.ts` (regex + unescape)
- `packages/native-parity/src/parse-dart.ts` (regex + unescape, single quotes)

All four files carry inline comments referencing the Primer integration test that found
them, so the next maintainer can trace the bug to its discovery.

## Next

- [Report R4 — Loader governance](Report-04-Loader-Governance)
- [Report R5 — CLI authoring](Report-05-CLI-Authoring)
