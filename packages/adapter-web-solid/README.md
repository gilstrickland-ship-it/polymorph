# @polymorph/adapter-web-solid

Solid 1.x binding for `@polymorph/adapter-web`. Same surface as the React and Vue bindings
(provider + composables + slots + role mapping + retrofit shim + themed primitives) — extends
the "framework-agnostic" claim to a third frontend framework with a fundamentally different
reactivity model.

```ts
import { render } from "solid-js/web";
import h from "solid-js/h";
import { InlineLoader } from "@polymorph/loaders";
import { ThemeProvider, ThemedText, PrimaryButton } from "@polymorph/adapter-web-solid";

const loaded = await new InlineLoader(auroraTheme).load();

render(
  () =>
    h(ThemeProvider, { theme: loaded.resolve("light") }, [
      h(ThemedText, { variant: "heading" }, "Open your account"),
      h(PrimaryButton, { label: "Continue", onPress: (_e) => next() }),
    ]),
  document.getElementById("root")!,
);
```

## Surface

| Layer | Export |
|---|---|
| Framework-agnostic core | re-exported from `@polymorph/adapter-web` (`toCssVariables`/`toCssVariablesString`/`createBridge`/`toTokenMap`) |
| Context + composables | `ThemeContext`, `ThemeProvider`, `useTheme`, `useThemeBridge`, `useResolvedTheme`, `useSlot`, `useThemedComponent` |
| Themed primitives | `Screen`, `Card`, `Stack`, `ThemedText`, `PrimaryButton` |

## How it works

`ThemeProvider` is built with `defineContext` + `createMemo` + `solid-js/h` (hyperscript). The
build stays tsc-only — **no JSX babel/vite plugin** — because the source uses `h()` rather than
JSX. Consumers can use either form: their JSX compiles to the same `createComponent` calls.

The provider injects a `<style>` block scoped to a `pm-theme-<uid>` wrapper class (`createUniqueId`)
and provides `{theme, bridge, slots, components, scope}` via context. Theme swaps update the
injected stylesheet through Solid's fine-grained reactivity — descendants don't re-render unless
they read theme-dependent values directly.

## Solid quirk: event-like callbacks

Solid's `h()` (and the JSX compiler) **promotes zero-argument function props on components to
reactive accessors** — i.e., it calls them on read. For event-like callbacks like `onPress`,
write the handler with at least one parameter (the Solid convention) so Solid leaves it as a
plain function:

```ts
// ✅ idiomatic Solid — Solid passes through unchanged
h(PrimaryButton, { onPress: (e) => handlePress(e) })

// 🚫 promoted to a reactive accessor; reading `props.onPress` would call it eagerly
h(PrimaryButton, { onPress: () => handlePress() })

// ✅ workaround: use a getter
h(PrimaryButton, { get onPress() { return () => handlePress(); } })
```

## Reactivity in primitives

`ThemedText`'s `variant` is captured once at mount (typical: variants don't change mid-life).
Style objects are `createMemo`'d so they stay reactive on theme changes. If you need a variant
to change reactively, render different `ThemedText` instances behind a `<Show>` or `<Match>`.

## Solid versions

`solid-js >= 1.8` (declared as an **optional peer** so the package doesn't auto-install Solid in
CI). Source uses `solid-js/h` for component declarations — no JSX/babel pipeline needed for
build; tests run under vitest's `happy-dom` environment with `resolve.conditions: ["browser", "development"]`
in `vitest.config.ts` so Solid routes to its client bundle.

> Implemented in **Spec L — adapter-web Solid binding**.
