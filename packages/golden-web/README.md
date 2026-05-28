# @polymorph/golden-web

Pure-Node golden-screenshot harness for the web adapter — **no browser binary required.**
Implements `@polymorph/conformance.GoldenHarness` using [satori](https://github.com/vercel/satori)
(HTML/JSX → SVG) + [@resvg/resvg-js](https://github.com/yisibl/resvg-js) (SVG → PNG) +
[pixelmatch](https://github.com/mapbox/pixelmatch) for diff. Runs in any Linux CI runner.

```ts
import { createWebGoldenHarness, accountCardScenario } from "@polymorph/golden-web";
import auroraTheme from "../../examples/mock-bank-aurora/theme/aurora.tokens.json";

const harness = createWebGoldenHarness({ baselineDir: "./baselines" });

const png = await harness.capture("account-card-aurora-light", {
  scenario: accountCardScenario,
  theme: auroraTheme,
  mode: "light",
});
const result = await harness.compare("account-card-aurora-light", png);
// → { match: true, diffRatio: 0 }   (against the committed baseline)
```

## What's deterministic

- **Bundled font**: Inter (regular + bold) shipped via `@fontsource/inter`. Theme `fontFamily`
  tokens are intentionally ignored for the diff — colors, radii, spacing, and layout are what
  the harness verifies, not font fidelity.
- **Pinned versions**: `satori` and `@resvg/resvg-js` are exact-pinned so renders don't drift on a
  patch bump.
- **Threshold**: pixel-diff defaults to 0.1% (`threshold: 0.001`). Configurable.

## Scenarios

A scenario is a plain object that builds a Satori tree from the resolved-token map. The default
`accountCardScenario` (400×300) exercises surface colors, primary action color, control radii, and
spacing — the visible bank-defining tokens. Adapters / FIs can author their own scenarios for
SDK-specific coverage.

## Update baselines

```bash
pnpm --filter @polymorph/golden-web update-baselines
```

Re-renders every scenario × bank × mode and writes them to `./baselines/*.png`. Run this after
intentionally changing a scenario or the bank themes — review the PNG diff in the PR.

## Pixel diff

`diffPngs(actual, baseline, threshold?)` returns `{ match, diffRatio, diffPng? }`. `diffPng` is
emitted when the diff exceeds the threshold so CI can attach it as an artifact.

> Implements `GoldenHarness` from `@polymorph/conformance`. The conformance package's
> `headlessGoldenHarness` is the no-op placeholder; this package is the working implementation
> for the web platform. A React Native golden harness (Skia-backed or via Expo dev clients) is a
> separate follow-up.
