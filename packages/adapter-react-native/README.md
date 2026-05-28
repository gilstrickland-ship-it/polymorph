# @polymorph/adapter-react-native

The **first** Polymorph platform adapter. Takes a `ResolvedTheme` (from `@polymorph/core` or a
loader handle) and exposes it idiomatically to React Native.

```tsx
import { ThemeProvider, ThemedText, PrimaryButton } from "@polymorph/adapter-react-native";

<ThemeProvider theme={loaded.resolve("light")}>
  <ThemedText variant="heading">Open an account</ThemedText>
  <PrimaryButton label="Continue" onPress={next} />
</ThemeProvider>;
```

## Surface

- **`ThemeProvider` + hooks** — `useTheme`, `useThemeBridge`, `useResolvedTheme`, `useSlot`,
  `useThemedComponent`.
- **`ThemeBridge`** (`createBridge`) — RN-friendly typed accessors (`color`, `dim`, `num`,
  `typography`, `has`) over a `ResolvedTheme`.
- **Render slots** — `resolveSlot` / `useSlot` for named host overrides (`Header`, `PrimaryButton`,
  `Field`, `StepIndicator`, `Disclosure`).
- **Component mapping** — `resolveComponent` / `useThemedComponent` mapping a `ComponentRole` to a
  host component (optional power feature).
- **Retrofit shim** — `toTokenMap(resolved)` → a plain `pm.* → value` record for backing an
  existing SDK's theme/style layer without adopting Polymorph's components.
- **Themed primitives** — `Screen`, `Card`, `ThemedText`, `PrimaryButton`, `Field`,
  `StepIndicator`, styled entirely via the bridge.

## Architecture note

The neutral core (bridge, provider/hooks, slots, mapping, retrofit) imports only `react` and is
unit-tested here. `primitives.ts` is the **only** module importing `react-native`, which is an
**optional peer dependency** (an ambient type shim lets the package typecheck/build without RN
installed). On-device rendering of the primitives is verified in the Spec D demo.

> Implemented in **Spec C — React Native adapter**. Web, Flutter, and native iOS/Android adapters
> follow post-v1 against the same contract.
