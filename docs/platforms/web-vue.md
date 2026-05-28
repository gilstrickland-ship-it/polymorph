# Vue 3

`@polymorph/adapter-web-vue` wraps the framework-agnostic core with Vue 3's reactivity:
`provide` / `inject` for the bridge, render-function components for the primitives, and
composables that return `ref`-backed accessors.

## Setup

```vue
<script setup lang="ts">
import { ThemeProvider } from "@polymorph/adapter-web-vue";
import auroraTheme from "./aurora.tokens.json";

const resolved = /* resolveTheme(auroraTheme, "light") */;
</script>

<template>
  <ThemeProvider :theme="resolved">
    <Onboarding />
  </ThemeProvider>
</template>
```

## Composables

| Composable | Returns |
|---|---|
| `useTheme()` | reactive `{ resolved, bridge, scopeClassName }` |
| `useResolvedTheme()` | reactive `ResolvedTheme` |
| `useSlot(name, fallback)` | the host's override component, or `fallback` |
| `useThemedComponent(role, fallback)` | host component for `role`, or `fallback` |

`@angular`-style proxies aren't needed; Vue's reactivity tracks the bridge subscription
automatically.

## Themed primitives

```vue
<script setup lang="ts">
import { ThemedText, PrimaryButton } from "@polymorph/adapter-web-vue";
</script>

<template>
  <ThemedText variant="body">Hello</ThemedText>
  <PrimaryButton @press="next">Continue</PrimaryButton>
</template>
```

## SFC-less

The package uses render functions rather than `.vue` SFCs, so it has no compiler peer
dependency. Consumers using SFCs in their own code are unaffected.
