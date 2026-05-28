// @polymorph/adapter-kotlin — build-time codegen from a Polymorph theme to a Kotlin
// `PolymorphTheme` object for Jetpack Compose (colors, dimensions, typography, motion,
// shadows). The emitted file is self-contained — two helper data classes
// (`PolymorphTextStyle`, `PolymorphShadow`) are inlined so the consumer's Android app needs
// no Polymorph runtime dependency.

export { transformToKotlin, emitKotlinFromResolved, type TransformOptions } from "./codegen.js";
export {
  idToKotlinName,
  componentPropKotlinName,
  colorToKotlin,
  dimToKotlin,
  dimToKotlinSp,
  numberToKotlin,
  durationToKotlin,
  cubicBezierToKotlin,
  typographyToKotlin,
  shadowToKotlin,
} from "./kotlin.js";
