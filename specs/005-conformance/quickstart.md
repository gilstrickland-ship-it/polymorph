# Quickstart: Conformance Suite

## Run the bar

```bash
pnpm conformance                                  # Nx conformance target (headless)
pnpm --filter @polymorph/conformance test         # same suite via vitest
```

Runs the v1 acceptance corpus: Aurora + Borealis mock banks and the `@polymorph/spec` fixtures.

## Use the assertions

```ts
import { runThemeConformance, assertConforms, checkLoaderEquivalence } from "@polymorph/conformance";

const report = runThemeConformance(myTheme);     // { passed, checks: [{ name, passed, detail? }] }
assertConforms(myTheme, "my-bank");              // throws, listing failures, if it doesn't conform
await checkLoaderEquivalence(myTheme, "dark");   // Inline/Bundled/RemoteManifest agree
```

## Golden screenshots (deferred — needs a renderer)

```ts
import { headlessGoldenHarness, type GoldenHarness } from "@polymorph/conformance";
// headlessGoldenHarness.capture(...) throws GoldenHarnessUnavailableError in CI.
// On device (Expo/RN), an adapter implements GoldenHarness to capture/diff baselines.
```

## Verification → Success Criteria

- **SC-001/002**: `conformance.test.ts` — banks + valid spec fixtures conform; invalid don't.
- **SC-003**: loader-equivalence holds for both banks across light + dark.
- **SC-004**: `pnpm conformance` and `nx run-many -t build typecheck test conformance` are green.
