// @polymorph/native-parity — parses the three native codegens (Dart / Swift / Kotlin) back
// into a normalized token-by-token form and provides a diff for cross-adapter parity tests.
//
// The codegens emit deterministic, line-oriented output by design, so regex-based parsing is
// the right tool. The normalized snapshot erases language-specific surface noise (Swift's
// 0…1 colour channels, Kotlin's `f.dp` / `f.sp` suffixes, Dart's `Duration(seconds:)` form)
// so token-level equivalence is decidable across the three target languages.

export { parseDart } from "./parse-dart.js";
export { parseSwift } from "./parse-swift.js";
export { parseKotlin } from "./parse-kotlin.js";
export { diffSnapshots, type ParityMismatch } from "./diff.js";
export type { NormalizedValue, NormalizedSnapshot } from "./types.js";
