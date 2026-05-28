# @polymorph/adapter-web

The web counterpart to `@polymorph/adapter-react-native`. Takes a `ResolvedTheme` (from
`@polymorph/core` or a loader handle) and exposes it as **CSS custom properties** plus a React
binding (provider, hooks, slots, role mapping, retrofit shim, themed HTML primitives).

```tsx
import { ThemeProvider, ThemedText, PrimaryButton } from "@polymorph/adapter-web";

<ThemeProvider theme={loaded.resolve("light")}>
  <ThemedText variant="heading">Open an account</ThemedText>
  <PrimaryButton label="Continue" onPress={next} />
</ThemeProvider>;
```

## Surface

| Layer | Module | Notes |
|---|---|---|
| **Framework-agnostic core** | `css-vars`, `theme-bridge`, `slots`, `component-map`, `retrofit` | Imports only `@polymorph/spec` types. Use it without React from any web stack. |
| **React binding** | `provider`, `primitives` | `ThemeProvider`, hooks, themed `Screen`/`Card`/`Stack`/`ThemedText`/`PrimaryButton`/`Field`/`StepIndicator`. |

### CSS variables

`toCssVariables(resolved)` flattens a `ResolvedTheme` into a `{ "--pm-color-surface-base": …, … }`
record; `toCssVariablesString(resolved, ".aurora")` renders that as a stylesheet body. Typography
composites expand into one variable per sub-property (`--pm-typography-body-font-size`, etc.).

### Bridge

`createBridge(resolved)` returns `var(--…)` references rather than concrete values, so styles
resolve through the provider's injected stylesheet — swapping `theme` updates the variables and
the browser repaints, no React re-render of consumers needed.

```ts
const t = createBridge(resolved);
t.color("pm.color.action.primary.rest"); // "var(--pm-color-action-primary-rest)"
t.typography("pm.typography.body");        // { fontFamily, fontWeight, fontSize, ... }
```

### Provider

`ThemeProvider` injects a `<style>` block (scoped to a unique wrapper class — or your `scope`
prop) and provides context with `{ theme, bridge, slots, components, scope }`. Nested providers
are allowed (e.g. preview a different bank's theme inside a subtree).

### Retrofit

`toTokenMap(resolved)` returns concrete `pm.* → value` pairs (NOT CSS strings) — the shim target
for retrofitting an existing web SDK without adopting Polymorph's components.

> Implemented in **Spec F — Web adapter**. Vue/Angular/PWA bindings live in their own
> follow-up packages; this package is the framework-agnostic core + React binding.
