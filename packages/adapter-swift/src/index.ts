// @polymorph/adapter-swift — build-time codegen from a Polymorph theme to a Swift
// `PolymorphTheme` enum (colors, dimensions, typography, motion, shadows). The emitted file
// is self-contained — two helper structs (`PolymorphTextStyle`, `PolymorphShadow`) are inlined
// so the consumer's iOS / SwiftUI app needs no Polymorph runtime dependency.

export { transformToSwift, emitSwiftFromResolved, type TransformOptions } from "./codegen.js";
export {
  idToSwiftName,
  componentPropSwiftName,
  colorToSwift,
  dimToSwift,
  numberToSwift,
  durationToSwift,
  cubicBezierToSwift,
  typographyToSwift,
  shadowToSwift,
} from "./swift.js";
