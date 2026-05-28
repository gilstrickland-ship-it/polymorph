// @polymorph/conformance — the reusable cross-adapter conformance bar.
//
// Theme/runtime conformance (validity, resolution invariants, component fallback, loader
// equivalence) runs headlessly. Golden-screenshot conformance requires a platform renderer and
// is provided as a harness interface (see golden.ts).

export {
  runThemeConformance,
  checkResolvedInvariants,
  assertConforms,
  type ConformanceCheck,
  type ConformanceReport,
} from "./checks.js";
export { checkLoaderEquivalence } from "./loader-equivalence.js";
export { type GoldenHarness, GoldenHarnessUnavailableError, headlessGoldenHarness } from "./golden.js";

export const CONFORMANCE_VERSION = "0.0.0";
