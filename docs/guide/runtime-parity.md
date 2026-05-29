# Cross-adapter runtime parity

`@polymorph/native-parity` now covers **every adapter** — not just the three native
codegens, and not just relative to each other. Every adapter is asserted equivalent to a
**baseline computed directly from `resolveTheme`**. If a future adapter computes a value
differently than core, parity surfaces it before any rendered snapshot does.

## What it checks

For a theme × mode pair, the check:

1. Runs `resolveTheme(theme, mode)` and normalises it into a `NormalizedSnapshot` (the
   baseline).
2. Calls each adapter's transform — `toCssVariables` (Web), `transformToDart`,
   `transformToSwift`, `transformToKotlin`.
3. Parses each adapter's output back into a `NormalizedSnapshot`.
4. Diffs each against the baseline, returning the mismatched token names per adapter.

```ts
import { checkRuntimeParity, assertRuntimeParity } from "@polymorph/native-parity";

const results = checkRuntimeParity(themeJson, "light");
// [{ adapter: "web-css", mismatches: [] }, { adapter: "dart", mismatches: [] }, ...]

assertRuntimeParity(themeJson, "light", "aurora"); // throws on divergence with a readable diff
```

## Scope per adapter

| Adapter | What it emits | Baseline subset |
|---|---|---|
| Web (CSS vars) | One CSS variable per `pm.*` token. Typography composites expand into five sub-variables. | Tokens only (no component-role flat constants). |
| Dart / Swift / Kotlin | Token constants **plus** component-role flat constants (`buttonPrimaryBackground` etc.). | Full baseline including components. |

The Web adapter doesn't emit component-role vars because component slots in React / Vue /
Solid / Angular consume tokens through props at the call site. Native adapters emit flat
constants because the host's `Object.constName` / `EnumName.caseName` access patterns
expect them.

## Why "runtime parity" not just "native parity"

The original `@polymorph/native-parity` asserted the three native codegens agreed *with
each other*. That catches divergence between Dart and Swift but doesn't catch
"both wrong in the same way". The runtime-parity check asserts every adapter — including
Web — agrees with **core's resolution**, which is the source of truth.

Concretely: if the Swift adapter accidentally rounds line-height to 2 decimal places, the
old native-parity check still passes if Dart + Kotlin do the same rounding. Runtime parity
catches it because the baseline (from core) carries the full precision.

## Normalised value shape

Same `NormalizedValue` discriminated union as before — language-specific surface noise
(Swift's 0…1 colour channels, Kotlin's `f.dp` / `f.sp` suffixes, Dart's
`Duration(seconds:)`, CSS's `cubic-bezier(...)` / `8px`) is erased so cross-target
equality is decidable.

| Kind | Shape |
|---|---|
| color | `{ hex: "#rrggbb" }` (lowercase, alpha stripped) |
| dimension | `{ px: number }` (canonical px; `rem` / `em` → ×16) |
| number | `{ n: number }` |
| duration | `{ ms: number }` (canonical ms; `s` → ×1000) |
| cubicBezier | `{ values: [n, n, n, n] }` |
| typography | `{ family, weight, fontSizePx, lineHeight, letterSpacingPx }` |
| shadow | `{ shadows: [{ hex, xPx, yPx, blurPx }, …] }` |

## Composing with existing parity tests

The existing `parity.test.ts` (Dart ↔ Swift ↔ Kotlin pair-wise) still runs alongside the
new runtime parity. The two are complementary:

- **Pair-wise**: cheap, fast, catches per-language regressions.
- **Runtime baseline**: catches "every native adapter agrees with each other but disagrees
  with core" — rare but real once Web is in the mix.

CI gates on both. A failing runtime parity is a stronger signal — it usually means a
codegen has drifted from the contract's semantics, not just from a sibling target.

## What it doesn't check

- **Rendered output.** That's the job of `@polymorph/golden-web` (Web) and the platform
  test harnesses (Flutter / iOS / Android). Runtime parity catches divergence at the
  resolve layer; goldens catch it at the render layer.
- **Adapter-specific runtime APIs.** The check is on emitted value tables, not on
  `ThemeProvider`'s prop surface, hooks, or slots. Those are framework-shaped and
  covered by the per-adapter test suites.
- **Mode-routing logic.** The check runs per-mode; routing between modes is the host's
  responsibility and is covered separately.
