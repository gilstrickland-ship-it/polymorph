# @polymorph/conformance

The reusable cross-adapter **conformance bar** — shared assertions every theme/adapter must pass.

```ts
import { runThemeConformance, assertConforms, checkLoaderEquivalence } from "@polymorph/conformance";

runThemeConformance(theme);            // { passed, checks: [{ name, passed, detail? }] }
assertConforms(theme, "my-bank");      // throws, listing failures, if not conformant
await checkLoaderEquivalence(theme);   // Inline/Bundled/RemoteManifest agree
```

## What it checks (headless)

- **Validity** — schema + graph (via `@polymorph/core`).
- **Resolution invariants** per declared mode — all required tokens present, no aliases remain,
  pm-only keys, component fallback applied.
- **Loader equivalence** — Inline / Bundled / RemoteManifest resolve deep-equal.

Its tests run the v1 acceptance corpus: the **Aurora** and **Borealis** mock banks plus the
`@polymorph/spec` fixtures (valid conform; invalid don't). Run with `pnpm conformance`.

## Golden screenshots (deferred)

`GoldenHarness` is the interface adapters implement on a platform renderer (RN device/Expo,
browser) to capture/diff baselines. `headlessGoldenHarness` throws `GoldenHarnessUnavailableError`
— pixel capture isn't possible in a headless container, so baselines are captured on-device.

> Implemented in **Spec E — Conformance suite**.
