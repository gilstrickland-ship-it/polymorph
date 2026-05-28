// @polymorph/authoring — theme authoring pipeline.
//
// Ships two import paths:
//  - Tokens Studio (single-file consolidated or multi-file): an FI's Tokens Studio JSON +
//    a mapping config → a Polymorph theme that `@polymorph/core.validateTheme` accepts.
//  - Figma Variables (REST API response): an FI's Figma Variables JSON + a mapping config →
//    a Polymorph theme covering color / dimension / number / duration tokens.

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
export {
  importFigmaVariables,
  convertFigmaValue,
  figmaColorToHex,
  resolveAlias,
  type FigmaVariablesResponse,
  type FigmaVariable,
  type FigmaVariableCollection,
  type FigmaVariableValue,
  type FigmaVariableColorValue,
  type FigmaVariableAlias,
  type FigmaVariableResolvedType,
  type FigmaMapping,
} from "./figma-variables.js";
export type {
  TokensStudioExport,
  TokensStudioSet,
  TokensStudioToken,
  TokensStudioTheme,
  MappingConfig,
  ModeMapping,
} from "./types.js";
