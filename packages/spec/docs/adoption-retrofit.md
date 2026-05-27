# Retrofitting an existing SDK

Polymorph supports two adoption modes equally (Constitution Principle I/IV; spec FR-018–020):

- **Contract-native** — a new SDK reads `ResolvedTheme` and styles directly from `pm.*` ids.
- **Retrofit** — an already-shipped SDK keeps its components and is fed the contract's resolved
  values through a thin shim, **without a rewrite**.

The enabler is that [`ResolvedTheme`](../src/types.ts) is **plain, framework-neutral data** — no
React/Flutter/SwiftUI types, no styling-library coupling, keys are `pm.*` only and contain no
aliases.

## The shim pattern

An existing SDK usually already has a theme object or style API. A retrofit shim maps resolved
contract values onto it:

```ts
import type { ResolvedTheme } from "@polymorph/spec";

// Existing SDK's own theme shape (illustrative):
interface LegacyTheme { colors: { bg: string; primary: string; text: string }; radiusMd: number }

export function toLegacyTheme(rt: ResolvedTheme): LegacyTheme {
  const px = (id: string) => (rt.tokens[id as never]?.value as { value: number }).value;
  return {
    colors: {
      bg:      rt.tokens["pm.color.surface.base"]!.value as string,
      primary: rt.tokens["pm.color.action.primary.rest"]!.value as string,
      text:    rt.tokens["pm.color.text.body"]!.value as string,
    },
    radiusMd: px("pm.radius.control"),
  };
}
```

The SDK's components are unchanged; only the value source moves from hard-coded styles to the
resolved semantic tokens. Re-skinning across FIs is then a token/data change.

## Rules

- **Never reach around the contract.** Even in a retrofit, every themed value must trace to a
  `pm.*` semantic token — not to an FI primitive (Principle I; spec US6 acceptance).
- The **per-platform** interop surface (React Native context/provider, CSS variables, native env)
  is delivered by the adapter (Spec C). This contract package only guarantees the output is
  neutral enough to build those shims.
