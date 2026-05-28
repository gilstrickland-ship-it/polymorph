# Quickstart: Web Adapter

## React app

```tsx
import { InlineLoader } from "@polymorph/loaders";
import { ThemeProvider, ThemedText, PrimaryButton } from "@polymorph/adapter-web";

const loaded = await new InlineLoader(auroraTheme).load();

export function App() {
  return (
    <ThemeProvider theme={loaded.resolve("light")}>
      <ThemedText variant="heading">Open your account</ThemedText>
      <PrimaryButton label="Continue" onPress={next} />
    </ThemeProvider>
  );
}
```

`ThemeProvider` injects a `<style>` block scoped to a unique wrapper class — nested or
side-by-side themes coexist without collisions.

## Without React (any web stack)

```ts
import { toCssVariablesString } from "@polymorph/adapter-web";
import { resolveTheme } from "@polymorph/core";

const css = toCssVariablesString(resolveTheme(themeJson, "light"), ".aurora");
document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);
// then style your DOM with `var(--pm-color-surface-base)` etc.
```

## Slots & component mapping

```tsx
<ThemeProvider
  theme={resolved}
  slots={{ PrimaryButton: HostButton }}            // host overrides a named slot
  components={{ "button.primary": HostButton }}    // host maps a role to a component
>
```

## Retrofit an existing web SDK

```ts
import { toTokenMap } from "@polymorph/adapter-web";

const tokens = toTokenMap(resolved);
legacyTheme.colors.background = tokens["pm.color.surface.base"];
```

## Verification → Success Criteria

```bash
pnpm --filter @polymorph/adapter-web build typecheck test
nx run-many -t build typecheck test conformance --skip-nx-cache   # 10 projects green
```

- **SC-001/SC-002**: `css-vars.test.ts` + `theme-bridge.test.ts`.
- **SC-003**: `provider.test.ts` — react-test-renderer asserts a scoped `<style>` with the
  resolved variables.
