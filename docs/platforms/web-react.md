# React

`@polymorph/adapter-web` ships the React binding inline (no separate package). The provider
mounts a scoped `<style>` block; hooks read the resolved theme + bridge from context.

## Setup

```tsx
import { ThemeProvider, useTheme } from "@polymorph/adapter-web";

function App({ theme }) {
  return (
    <ThemeProvider theme={theme}>
      <Onboarding />
    </ThemeProvider>
  );
}

function Onboarding() {
  const { resolved, scopeClassName } = useTheme();
  return <main className={scopeClassName}>...</main>;
}
```

## Available hooks

| Hook | Returns |
|---|---|
| `useTheme()` | `{ resolved, bridge, scopeClassName }` |
| `useResolvedTheme()` | the `ResolvedTheme` only |
| `useSlot(name, fallback)` | the host's `<PrimaryButton>` override, or `fallback` |
| `useThemedComponent(role, fallback)` | the host's component for `role`, or `fallback` |

Each hook throws a clear error outside a `ThemeProvider`.

## Slots + component mapping

```tsx
<ThemeProvider theme={theme} slots={{ PrimaryButton: HostButton }}>
  ...
</ThemeProvider>
```

Inside the SDK:

```tsx
const Button = useSlot("PrimaryButton", DefaultPrimaryButton);
return <Button>Continue</Button>;
```

Falls back to the SDK's themed component when no override is registered.

## Themed primitives

The package re-exports `ThemedText` and `PrimaryButton` — small components that read the
resolved theme and apply the right tokens. Most SDK code reaches for these instead of writing
raw inline-style calls.

```tsx
import { ThemedText, PrimaryButton } from "@polymorph/adapter-web";

<ThemedText variant="body">Hello</ThemedText>
<PrimaryButton onPress={...}>Continue</PrimaryButton>
```
