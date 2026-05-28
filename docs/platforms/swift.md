# iOS / SwiftUI (Swift codegen)

`@polymorph/adapter-swift` is **build-time codegen** for SwiftUI. The CLI's
`transform --target swift` emits a self-contained `.swift` file — two helper structs inlined
at the top so the consumer's app has **no external Polymorph dependency**, then a `public
enum` namespace with one `public static let` per resolved token.

## Generate

```bash
pnpm polymorph transform ./aurora.tokens.json \
  --target swift \
  --mode light \
  --class AuroraThemeLight \
  --output Sources/Polymorph/AuroraThemeLight.swift
```

## Consume

```swift
import SwiftUI

struct ContentView: View {
  var body: some View {
    Text("Hello")
      .foregroundStyle(AuroraThemeLight.colorTextBody)
      .polymorphText(AuroraThemeLight.typographyBody)
      .padding(AuroraThemeLight.spaceMd)
      .background(AuroraThemeLight.colorSurfaceRaised)
  }
}
```

## Applying a `PolymorphTextStyle`

`Font` alone can't carry line-height / letter-spacing — those are view modifiers. The emitter
bundles everything into a struct; a one-line extension on the consumer side applies the lot:

```swift
extension View {
  func polymorphText(_ style: PolymorphTextStyle) -> some View {
    self.font(style.font)
        .fontWeight(style.weight)
        .lineSpacing(style.lineHeight * style.fontSize - style.fontSize)
        .tracking(style.letterSpacing)
  }
}
```

## Type mappings

| Polymorph `$type` | Swift |
|---|---|
| `color` | `Color(red:green:blue:)` with `0...1` channels (alpha forced to 1.0 in v1) |
| `dimension` | `CGFloat` (px assumed; `rem` × 16) |
| `number` | `Double` |
| `duration` | `TimeInterval` (seconds — `220ms` → `0.22`) |
| `cubicBezier` | `(Double, Double, Double, Double)` tuple — pass to `Animation.timingCurve(...)` |
| `typography` | `PolymorphTextStyle` (font + size + weight + lineHeight + letterSpacing) |
| `shadow` | `[PolymorphShadow]` (inset commented as unsupported) |

## UIKit bridging

```swift
let uiColor = UIColor(AuroraThemeLight.colorActionPrimaryRest)
let cgFloat = AuroraThemeLight.spaceMd
```

`Color(...)` and `Font(...)` both bridge to UIKit equivalents via SwiftUI's built-in
initialisers.

## Goldens & drift guard

Four reference goldens live under `packages/adapter-swift/tests/golden/`. CI regenerates them
on every PR and fails on diff.
