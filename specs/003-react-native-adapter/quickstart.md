# Quickstart: React Native Adapter

```tsx
import { InlineLoader } from "@polymorph/loaders";
import { ThemeProvider, ThemedText, PrimaryButton, useThemeBridge } from "@polymorph/adapter-react-native";

const loaded = await new InlineLoader(auroraTheme).load();

export function App() {
  return (
    <ThemeProvider theme={loaded.resolve("light")}>
      <Onboarding />
    </ThemeProvider>
  );
}
```

## Slots & component mapping

```tsx
<ThemeProvider
  theme={resolved}
  slots={{ PrimaryButton: HostButton }}            // render-slot override
  components={{ "button.primary": HostButton }}    // role→component mapping
>
```

## Retrofit an existing SDK

```ts
import { toTokenMap } from "@polymorph/adapter-react-native";
const tokens = toTokenMap(resolved);     // { "pm.color.surface.base": "#...", ... }
legacyTheme.colors.background = tokens["pm.color.surface.base"];
```

## Verification (maps to Success Criteria)

```bash
pnpm --filter @polymorph/adapter-react-native build       # incl. primitives vs the RN ambient shim
pnpm --filter @polymorph/adapter-react-native typecheck
pnpm --filter @polymorph/adapter-react-native test         # bridge, slots/mapping/retrofit, provider (react-test-renderer)
```

- **SC-001/002**: provider + slot tests pass.
- **SC-003**: `toTokenMap` test asserts pm-only, alias-free.
- **SC-004**: builds/typechecks with `react-native` not installed.
- On-device rendering of primitives: verified in **Spec D** (demo + mock banks).
