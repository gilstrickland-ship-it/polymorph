# React Native

`@polymorph/adapter-react-native` was the first vertical-slice adapter and is the reference
for what an "in-app runtime" Polymorph adapter looks like. It exposes a `ThemeProvider`,
hooks, slots, an optional component-mapping registry, themed primitives, and a retrofit shim
for projects with existing styled components.

## Setup

```tsx
import { ThemeProvider } from "@polymorph/adapter-react-native";
import { resolveTheme } from "@polymorph/core";

const resolved = resolveTheme(auroraTheme, "light");

export default function App() {
  return (
    <ThemeProvider theme={resolved}>
      <Onboarding />
    </ThemeProvider>
  );
}
```

## Hooks

| Hook | Returns |
|---|---|
| `useTheme()` | `{ resolved, mode }` |
| `useResolvedTheme()` | the `ResolvedTheme` only |
| `useSlot(name, fallback)` | host override or `fallback` |
| `useThemedComponent(role, fallback)` | host component for `role`, or `fallback` |

## Themed primitives

```tsx
import { ThemedText, ThemedView, PrimaryButton } from "@polymorph/adapter-react-native";

<ThemedView surface="raised">
  <ThemedText variant="body">Hello</ThemedText>
  <PrimaryButton onPress={next}>Continue</PrimaryButton>
</ThemedView>
```

Each primitive reads only resolved tokens — never bank primitives, never `react-native` colour
literals.

## Retrofit shim

`useStyledTokens()` returns a flat snapshot keyed by token id; useful when integrating with an
existing styled component library:

```tsx
const t = useStyledTokens();
const styles = StyleSheet.create({
  card: {
    backgroundColor: t["pm.color.surface.raised"],
    padding: t["pm.space.md"],
    borderRadius: t["pm.radius.card"],
  },
});
```

## Slots + component mapping

```tsx
<ThemeProvider
  theme={resolved}
  slots={{ PrimaryButton: HostButton }}
  components={{ "input": HostInput }}
>
  ...
</ThemeProvider>
```

`slots` overrides by name; `components` overrides by role. Both compare by reference — the SDK
asks the registry and renders whatever you registered.
