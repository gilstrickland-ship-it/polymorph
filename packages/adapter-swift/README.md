# @polymorph/adapter-swift

Build-time codegen from a Polymorph theme to a Swift `PolymorphTheme` enum — **no Xcode
toolchain required.** Emits text; the consumer's iOS / SwiftUI build compiles the output.

```bash
# Via the CLI
polymorph transform ./aurora.tokens.json --target swift --mode light \
  --class AuroraThemeLight --output Sources/Polymorph/PolymorphTheme.swift

# Or programmatically
import { transformToSwift } from "@polymorph/adapter-swift";
const swift = transformToSwift(themeJson, { mode: "light", enumName: "AuroraThemeLight" });
```

## What you get

A single `.swift` file declaring two small helper structs (`PolymorphTextStyle`,
`PolymorphShadow`) and one `public enum` (used as a namespace) with one `public static let` per
resolved semantic and component token:

```swift
import SwiftUI

public struct PolymorphTextStyle {
  public let font: Font
  public let fontSize: CGFloat
  public let weight: Font.Weight
  public let lineHeight: CGFloat
  public let letterSpacing: CGFloat
  public init(...) { ... }
}

public struct PolymorphShadow {
  public let color: Color
  public let x: CGFloat
  public let y: CGFloat
  public let radius: CGFloat
  public init(...) { ... }
}

public enum AuroraThemeLight {
  // MARK: - Colors
  public static let colorSurfaceBase: Color = Color(red: 1, green: 1, blue: 1)
  public static let colorActionPrimaryRest: Color = Color(red: 0.1216, green: 0.3608, blue: 1)
  // ... 28 more

  // MARK: - Dimensions / spacing / radii / sizes
  public static let spaceMd: CGFloat = 16.0
  public static let radiusControl: CGFloat = 10.0
  // ...

  // MARK: - Typography
  public static let typographyBody: PolymorphTextStyle = PolymorphTextStyle(
      font: Font.custom("Inter", size: 16.0),
      fontSize: 16.0,
      weight: .regular,
      lineHeight: 1.4,
      letterSpacing: 0.0
    )
  // ...

  // MARK: - Motion (durations + easings)
  public static let motionDurationBase: TimeInterval = 0.22
  public static let motionEasingStandard: (Double, Double, Double, Double) = (0.4, 0.0, 0.2, 1.0)

  // MARK: - Shadows
  public static let elevationRaised: [PolymorphShadow] = [
      PolymorphShadow(color: Color(red: 0, green: 0, blue: 0), x: 0.0, y: 2.0, radius: 6.0),
    ]

  // MARK: - Component tokens (override resolved)
  public static let buttonPrimaryBackground: Color = Color(red: 0.1216, green: 0.3608, blue: 1)
  public static let buttonPrimaryRadius: CGFloat = 10.0
}
```

The two helper structs are inlined deliberately so the generated file has **no external
Polymorph dependency** — drop it into your Xcode project and import.

## Type mappings

| Polymorph `$type` | Swift |
|---|---|
| `color` (any CSS Color 4 form) | `Color(red:green:blue:)` (0…1, alpha forced to 1.0 in v1; OKLab/display-p3 converted to sRGB via `@polymorph/core.parseColor`) |
| `dimension` | `CGFloat` (px assumed; `rem` × 16) |
| `number` | `Double` |
| `duration` | `TimeInterval` (seconds — `220ms` → `0.22`) |
| `cubicBezier` | `(Double, Double, Double, Double)` tuple — pass directly into `Animation.timingCurve(...)` |
| `typography` composite | `PolymorphTextStyle` (font + fontSize + weight + lineHeight + letterSpacing — apply per-property in SwiftUI) |
| `shadow` (single or array) | `[PolymorphShadow]` (inset isn't representable on SwiftUI's `.shadow`; commented inline if present) |

Component-token roles emit constants with camelCased role + property names
(`buttonPrimaryBackground`, `inputBorderFocus`, etc.). `defaultsFrom` resolution has already
been applied during `resolveTheme`, so each property has a concrete value.

### Applying a `PolymorphTextStyle`

`Font` alone cannot express line-height / letter-spacing — those are view modifiers — so the
emitter packages everything into a struct. A small SwiftUI extension you write once:

```swift
extension View {
  func polymorphText(_ style: PolymorphTextStyle) -> some View {
    self.font(style.font)
        .fontWeight(style.weight)
        .lineSpacing(style.lineHeight * style.fontSize - style.fontSize)
        .tracking(style.letterSpacing)
  }
}

Text("Hello").polymorphText(AuroraThemeLight.typographyBody)
```

## CLI

```text
polymorph transform <file> --target swift [--mode <mode>] [--class <Name>] [--output <path>]
```

| Flag | Default | Notes |
|---|---|---|
| `--target` | (required) | `swift` for this adapter (also accepts `dart`). |
| `--mode` | `light` | Polymorph theme mode to render. |
| `--class` | `PolymorphTheme` | Name of the generated Swift enum. |
| `--output` | stdout | Writes to the given path (parent dirs created). |

Invalid themes (schema or graph) exit `1` with located errors before any output is produced.

## Goldens

Four reference goldens are committed under `tests/golden/` (`aurora_{light,dark}.swift`,
`borealis_{light,dark}.swift`). A vitest test regenerates each and asserts byte-equality, plus
per-converter unit tests cover edges. Regenerate after intentional changes:

```bash
pnpm --filter @polymorph/adapter-swift update-goldens
```

CI's drift guard runs the same generator on every PR.

> Implemented in **Spec O — Swift adapter (Swift codegen)**. Android (`--target kotlin`) can
> follow the same shape.
