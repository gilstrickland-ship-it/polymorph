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
| `useTheme()` | `{ theme, bridge, slots, components }` |
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

`toTokenMap(resolvedTheme)` returns a flat `pm.* → value` snapshot of the **raw** resolved
values (a dimension stays `{ value, unit }`) — useful for feeding an existing SDK's own theme
object. For building React Native styles, use the bridge, which converts to RN-native types
(`color()` → string, `dim()` → number):

```tsx
const { bridge } = useTheme();
const styles = StyleSheet.create({
  card: {
    backgroundColor: bridge.color("pm.color.surface.raised"),
    padding: bridge.dim("pm.space.md"),
    borderRadius: bridge.dim("pm.radius.card"),
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
