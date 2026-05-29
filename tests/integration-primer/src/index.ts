// @polymorph/integration-primer — public-design-system integration test harness.
//
// Pulls @primer/primitives (GitHub's published design tokens) via npm, builds a real
// Polymorph theme from their semantic vocabulary, and exercises every shipped spec
// against the result. Findings live in `tests/*.test.ts` (assertions) and `wiki/`
// (human-readable per-spec report).

export {
  loadPrimerTheme,
  loadPrimerBase,
  loadPrimerFigmaTokens,
  parseCssVars,
  describePrimer,
  primerPath,
} from "./primer-loader.js";

export { buildPolymorphThemeFromPrimer } from "./build-theme.js";
