// @polymorph/authoring — theme authoring pipeline.
//
// Ships three import paths:
//  - Tokens Studio (single-file consolidated or multi-file): an FI's Tokens Studio JSON +
//    a mapping config → a Polymorph theme that `@polymorph/core.validateTheme` accepts.
//  - Figma Variables (REST API response): an FI's Figma Variables JSON + a mapping config →
//    a Polymorph theme covering color / dimension / number / duration tokens.
//  - Figma Styles (curated Text + Effect styles input): an FI's resolved Figma text/effect
//    styles + a mapping config → typography + shadow tokens. Designed to compose with the
//    Variables importer for orgs whose tokens live entirely in Figma.

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
export {
  importFigmaStyles,
  convertFigmaTextStyle,
  convertFigmaEffects,
  type FigmaStylesInput,
  type FigmaStylesMapping,
  type FigmaTextStyle,
  type FigmaEffect,
} from "./figma-styles.js";
export type {
  TokensStudioExport,
  TokensStudioSet,
  TokensStudioToken,
  TokensStudioTheme,
  MappingConfig,
  ModeMapping,
} from "./types.js";
