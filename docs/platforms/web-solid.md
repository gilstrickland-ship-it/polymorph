# Solid 1.x

`@polymorph/adapter-web-solid` provides Solid bindings using `solid-js/h` hyperscript (no
JSX/babel transform required). Same shape as the other bindings: a provider for context, hooks
for theme/bridge/slots, themed primitives.

## Setup

```tsx
import { render } from "solid-js/web";
import { ThemeProvider } from "@polymorph/adapter-web-solid";

render(() => (
  <ThemeProvider theme={resolved}>
    <Onboarding />
  </ThemeProvider>
), document.getElementById("app")!);
```

## Composables

| Composable | Returns |
|---|---|
| `useTheme()` | accessor returning `{ resolved, bridge, scopeClassName }` |
| `useResolvedTheme()` | accessor returning the `ResolvedTheme` |
| `useSlot(name, fallback)` | accessor returning the host override or `fallback` |
| `useThemedComponent(role, fallback)` | accessor returning host component or `fallback` |

Solid's reactivity is fine-grained — call the accessor inside the rendered output to
re-subscribe.

## A footgun to know about

Solid's hyperscript promotes zero-arg function props on components to reactive accessors. Write
event-like callbacks with at least one parameter:

```tsx
// Wrong — Solid treats this as an accessor and calls it eagerly
<PrimaryButton onPress={() => navigate("next")} />

// Right
<PrimaryButton onPress={(_e) => navigate("next")} />
```

The primitives' typings encode the parameter so TypeScript catches the mistake.

## Themed primitives

```tsx
import { ThemedText, PrimaryButton } from "@polymorph/adapter-web-solid";

<ThemedText variant="body">Hello</ThemedText>
<PrimaryButton onPress={(_e) => next()}>Continue</PrimaryButton>
```
