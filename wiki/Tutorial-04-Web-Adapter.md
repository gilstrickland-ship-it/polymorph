# Tutorial 04 — Wire the Web adapter into a React app

**Time**: ~10 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate), a valid `theme.tokens.json`, a React 18+ app.

---

## Install

```bash
npm install @polymorph/spec @polymorph/core @polymorph/loaders @polymorph/adapter-web
```

Vue / Solid / Angular? Swap `@polymorph/adapter-web` for `@polymorph/adapter-web-vue`,
`@polymorph/adapter-web-solid`, or `@polymorph/adapter-web-angular`. The composition shape
is identical; the framework binding differs.

## Mount the theme

```tsx
// App.tsx
import { ThemeProvider } from "@polymorph/adapter-web";
import { resolveTheme } from "@polymorph/core";
import myTheme from "./theme.tokens.json" with { type: "json" };

const resolved = resolveTheme(myTheme, "light");

export function App() {
  return (
    <ThemeProvider theme={resolved}>
      <YourSurface />
    </ThemeProvider>
  );
}
```

`ThemeProvider` does two things:

1. Injects a `<style>` element with every `pm.*` token as a CSS variable.
2. Provides a `useThemeBridge()` hook for child components to read tokens by id.

## Use the themed primitives

The adapter ships a small primitive set so your components don't need to reach for
`useThemeBridge`:

```tsx
import {
  Screen, Card, Stack, ThemedText,
  PrimaryButton, Field, StepIndicator,
} from "@polymorph/adapter-web";

function YourSurface() {
  return (
    <Screen>
      <Stack>
        <ThemedText variant="heading">Hello</ThemedText>
        <Card>
          <Stack>
            <ThemedText variant="body">Form goes here.</ThemedText>
            <Field label="Email" placeholder="you@example.com" />
            <PrimaryButton label="Continue" onPress={() => {}} />
          </Stack>
        </Card>
        <StepIndicator count={3} active={0} />
      </Stack>
    </Screen>
  );
}
```

Every visible value resolves from `myTheme` — change a token, every primitive re-renders.

## Custom components

When you need a themed component the adapter doesn't ship, use `useThemeBridge`:

```tsx
import { useThemeBridge } from "@polymorph/adapter-web";

function MyBadge({ label }: { label: string }) {
  const t = useThemeBridge();
  return (
    <span
      style={{
        backgroundColor: t.color("pm.color.feedback.success"),
        color: t.color("pm.color.text.onAction"),
        padding: `${t.dim("pm.space.xs")} ${t.dim("pm.space.sm")}`,
        borderRadius: t.dim("pm.radius.pill"),
        fontSize: t.dim("pm.typography.caption-font-size"),
      }}
    >
      {label}
    </span>
  );
}
```

`t.color(id)` returns a CSS-var reference (`var(--pm-color-feedback-success)`), so
hot-swapping a theme at runtime doesn't require re-rendering — the browser repaints
naturally.

## Switching modes at runtime

```tsx
import { useState } from "react";
import { resolveTheme } from "@polymorph/core";

const [mode, setMode] = useState<"light" | "dark">("light");
const resolved = useMemo(() => resolveTheme(myTheme, mode), [mode]);

return <ThemeProvider theme={resolved}>{children}</ThemeProvider>;
```

Or rely on the CSS-vars `@media (prefers-reduced-motion)` block the adapter emits — see
[Tutorial 09 — Reduced motion](Tutorial-09-Reduced-Motion).

## SSR

```ts
import { toCssVariablesString } from "@polymorph/adapter-web";

export default async function Layout({ children }) {
  const css = toCssVariablesString(resolveTheme(myTheme, "light"));
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## What's next

- [Tutorial 05 — Native codegen](Tutorial-05-Native-Codegen) if you ship iOS / Android / Flutter
- [Tutorial 07 — Builder](Tutorial-07-Builder) to build an in-app theme editor
