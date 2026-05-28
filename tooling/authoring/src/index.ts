// @polymorph/authoring — theme authoring pipeline.
//
// Currently ships the Tokens Studio (single-file consolidated export) importer:
// take an FI's Tokens Studio JSON + a mapping config (Polymorph semantic id → Tokens Studio
// dotted path), produce a Polymorph theme that `@polymorph/core.validateTheme` accepts.

export { importTokensStudio, lintMapping, type ImportResult, type ImportReport } from "./tokens-studio.js";
export { consolidateTokensStudioFiles, loadTokensStudioFromDirectory } from "./multi-file.js";
export {
  convertToDtcg,
  parseDimension,
  normalizeFontWeight,
  normalizeLineHeight,
  normalizeOpacity,
  resolveValue,
} from "./convert.js";
export type {
  TokensStudioExport,
  TokensStudioSet,
  TokensStudioToken,
  TokensStudioTheme,
  MappingConfig,
  ModeMapping,
} from "./types.js";
