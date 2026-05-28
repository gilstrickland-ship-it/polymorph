# @polymorph/adapter-web-vue

Vue 3 binding for `@polymorph/adapter-web`. Same surface as the React binding (provider + hooks +
slots + role mapping + retrofit shim + themed primitives) — proves the web core is genuinely
framework-agnostic.

```ts
<script setup lang="ts">
import { InlineLoader } from "@polymorph/loaders";
import { ThemeProvider, ThemedText, PrimaryButton } from "@polymorph/adapter-web-vue";
const loaded = await new InlineLoader(auroraTheme).load();
</script>

<template>
  <ThemeProvider :theme="loaded.resolve('light')">
    <ThemedText variant="heading">Open your account</ThemedText>
    <PrimaryButton label="Continue" @press="next" />
  </ThemeProvider>
</template>
```

## Surface

| Layer | Export |
|---|---|
| Framework-agnostic core | re-exported from `@polymorph/adapter-web` (`toCssVariables`/`toCssVariablesString`/`createBridge`/`toTokenMap`) |
| Provider + composables | `ThemeProvider`, `useTheme`, `useThemeBridge`, `useResolvedTheme`, `useSlot`, `useThemedComponent` |
| Themed primitives | `Screen`, `Card`, `Stack`, `ThemedText`, `PrimaryButton` |

### How it works

`ThemeProvider` is implemented with `defineComponent` + a render function (no `.vue` SFC compiler
required). It computes a scoped CSS-variable stylesheet from the resolved theme, injects it via
`<style data-polymorph-theme="<scope>">`, and provides context to descendants via Vue's `provide`
under the `ThemeKey` injection key.

Theme switches update the injected stylesheet — descendants don't re-render unless they read
theme-dependent values directly. Slot and component overrides are read via `toRaw` so component
references compare by identity (Vue's reactive proxies don't leak into rendered trees).

### Slots vs Vue's native slots

Polymorph's **render slots** are a registry of `Component` overrides for named roles
(`PrimaryButton`, `Field`, …) — distinct from Vue's native `<slot>` content-projection. They
coexist: the `slots` *prop* on `<ThemeProvider>` is the override registry; the default `<slot>`
is where children go.

## Vue versions

`vue >= 3.4` (declared as an **optional peer** so the package doesn't auto-install Vue in CI).
The provider tolerates Vue 3.4+ by falling back to `getCurrentInstance().uid` for scope-class
generation; Vue 3.5+ users can pass `scope` if they want a stable known class.

> Implemented in **Spec J — adapter-web Vue binding**. Angular / Solid / Svelte / PWA bindings
> follow the same pattern over the framework-agnostic core.
