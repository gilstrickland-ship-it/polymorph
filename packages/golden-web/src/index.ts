// @polymorph/golden-web — pure-Node golden-screenshot harness (Satori → resvg → pixelmatch).
//
// Implements @polymorph/conformance's GoldenHarness interface without a browser binary, so it
// runs in any Linux CI runner. Determinism: bundled Inter font, pinned satori/resvg versions,
// a pixel-diff threshold of 0.1% by default.

export { createWebGoldenHarness, type WebGoldenPayload, type WebHarnessOptions } from "./harness.js";
export { renderScenarioToPng } from "./render.js";
export { diffPngs, type DiffResult } from "./diff.js";
export { accountCardScenario, DEFAULT_SCENARIOS, type WebGoldenScenario, type SatoriNode } from "./scenarios.js";
export { SATORI_FONTS } from "./font.js";
