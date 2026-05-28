# Quickstart: Reference Demo + Mock Banks

## Regenerate the bank themes

```bash
node examples/gen-mock-bank-themes.mjs   # writes mock-bank-{aurora,borealis}/theme/*.tokens.json
```

## The proof (headless)

```bash
pnpm --filter @polymorph/example-reference-sdk-onboarding test
#   reskin.test.ts            — both banks valid; used tokens resolve in both; brand tokens differ; dark ≠ light
#   contract-adherence.test.ts — SDK source has no hex/rgb, no react-native, no bank imports
pnpm --filter "@polymorph/example-*" run typecheck
```

## How a bank hosts the SDK (the only bank-specific code)

```tsx
// examples/mock-bank-aurora/src/App.tsx
import { ThemeProvider } from "@polymorph/adapter-react-native";
import { Onboarding } from "@polymorph/example-reference-sdk-onboarding";
import { resolveTheme } from "@polymorph/core";
import aurora from "../theme/aurora.tokens.json";

export const App = () => (
  <ThemeProvider theme={resolveTheme(aurora, "light")}>
    <Onboarding />
  </ThemeProvider>
);
```

Borealis's shell is identical except `import borealis from "../theme/borealis.tokens.json"` — the
proof that re-skinning is a theme/data change only.

## On-device (deferred)

Run a shell under Expo/React Native to see the onboarding flow re-skin between Aurora and Borealis;
capture before/after screenshots. Golden-screenshot automation is **Spec E**.

## Verification → Success Criteria

- **SC-001/002**: `reskin.test.ts` green. **SC-003**: `contract-adherence.test.ts` green.
- **SC-004**: `nx run-many -t build typecheck test` green across the workspace.
