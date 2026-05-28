// @polymorph/adapter-flutter — build-time codegen from a Polymorph theme to a Dart
// `PolymorphTheme` class (colors, dimensions, typography, motion, shadows + a Material
// ThemeData factory). No Dart toolchain required — the package emits text; consumers compile
// the generated file with their Flutter build.

export { transformToDart, emitDartFromResolved, type TransformOptions } from "./codegen.js";
export {
  idToDartName,
  componentPropDartName,
  colorToDart,
  dimToDart,
  numberToDart,
  durationToDart,
  cubicBezierToDart,
  typographyToDart,
  shadowToDart,
} from "./dart.js";
