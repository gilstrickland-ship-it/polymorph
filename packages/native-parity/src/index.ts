// @polymorph/native-parity — parses every adapter's output back into a normalized
// token-by-token form and provides a parity check across them + against the core baseline.
//
// The native codegens (Dart / Swift / Kotlin) emit deterministic, line-oriented source by
// design, so regex-based parsing is the right tool. The Web adapter emits CSS custom
// properties; we parse those too. The normalized snapshot erases per-target surface noise
// (Swift's 0…1 colour channels, Kotlin's `f.dp` / `f.sp` suffixes, Dart's
// `Duration(seconds:)` form, CSS's `cubic-bezier(...)` / `Npx`) so token-level equivalence
// is decidable across every target — including against core's own resolution.

export { parseDart } from "./parse-dart.js";
export { parseSwift } from "./parse-swift.js";
export { parseKotlin } from "./parse-kotlin.js";
export { parseCssVars } from "./parse-css-vars.js";
export { normalizeResolved, idToCamelName } from "./normalize-resolved.js";
export { checkRuntimeParity, assertRuntimeParity, type AdapterParity } from "./runtime-parity.js";
export { diffSnapshots, type ParityMismatch } from "./diff.js";
export type { NormalizedValue, NormalizedSnapshot } from "./types.js";
