# @polymorph/adapter-kotlin

Build-time codegen from a Polymorph theme to a Kotlin `PolymorphTheme` object for Jetpack
Compose — **no Android toolchain required.** Emits text; the consumer's Gradle build compiles
the output.

```bash
# Via the CLI
polymorph transform ./aurora.tokens.json --target kotlin --mode light \
  --class AuroraThemeLight --output app/src/main/java/polymorph/theme/AuroraThemeLight.kt

# Or programmatically
import { transformToKotlin } from "@polymorph/adapter-kotlin";
const kt = transformToKotlin(themeJson, { mode: "light", objectName: "AuroraThemeLight" });
```

## What you get

A single `.kt` file declaring two helper data classes (`PolymorphTextStyle`, `PolymorphShadow`)
followed by one top-level `object` (singleton namespace) with one `val` per resolved semantic
and component token:

```kotlin
package polymorph.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class PolymorphTextStyle(
  val fontFamily: String,
  val fontSize: TextUnit,
  val fontWeight: FontWeight,
  val lineHeight: Float,
  val letterSpacing: TextUnit,
)

data class PolymorphShadow(
  val color: Color,
  val x: Dp,
  val y: Dp,
  val radius: Dp,
)

object AuroraThemeLight {
  // region Colors
  val colorSurfaceBase: Color = Color(0xFFFFFFFF)
  val colorActionPrimaryRest: Color = Color(0xFF1F5CFF)
  // ... 28 more
  // endregion

  // region Dimensions / spacing / radii / sizes
  val spaceMd: Dp = 16.0f.dp
  val radiusControl: Dp = 10.0f.dp
  // endregion

  // region Typography
  val typographyBody: PolymorphTextStyle = PolymorphTextStyle(
    fontFamily = "Inter",
    fontSize = 16.0f.sp,
    fontWeight = FontWeight.W400,
    lineHeight = 1.4f,
    letterSpacing = 0.0f.sp,
  )
  // endregion

  // region Motion (durations + easings)
  val motionDurationBase: Int = 220
  val motionEasingStandard: CubicBezierEasing = CubicBezierEasing(0.4f, 0.0f, 0.2f, 1.0f)
  // endregion

  // region Shadows
  val elevationRaised: List<PolymorphShadow> = listOf(
    PolymorphShadow(color = Color(0xFF000000), x = 0.0f.dp, y = 2.0f.dp, radius = 6.0f.dp),
  )
  // endregion

  // region Component tokens (override resolved)
  val buttonPrimaryBackground: Color = Color(0xFF1F5CFF)
  val buttonPrimaryRadius: Dp = 10.0f.dp
  // endregion
}
```

The helper data classes are inlined deliberately so the generated file has **no external
Polymorph dependency** — drop it into your Android module and `import`.

## Type mappings

| Polymorph `$type` | Kotlin / Jetpack Compose |
|---|---|
| `color` (any CSS Color 4 form) | `Color(0xFFRRGGBB)` (alpha forced to FF in v1; OKLab/display-p3 converted to sRGB via `@polymorph/core.parseColor`) |
| `dimension` | `Dp` via `.dp` extension (px assumed; `rem` × 16) |
| `number` | `Float` (with `f` suffix) |
| `duration` | `Int` milliseconds (`220ms` → `220`, `1s` → `1000`) — feeds straight into Compose `tween(durationMillis = …)` |
| `cubicBezier` | `CubicBezierEasing(...)` from `androidx.compose.animation.core` |
| `typography` composite | `PolymorphTextStyle` (fontFamily as String + sizes in `.sp` + `FontWeight.W<N>` + line-height multiplier + letter-spacing in `.sp`) |
| `shadow` (single or array) | `List<PolymorphShadow>` (inset isn't representable in Compose's shadow modifiers; commented inline if present) |

Component-token roles emit constants with camelCased role + property names
(`buttonPrimaryBackground`, `inputBorderFocus`, etc.). The `defaultsFrom` resolution has
already been applied during `resolveTheme`, so each property has a concrete value.

### Applying a `PolymorphTextStyle`

`fontFamily` is emitted as a plain `String` because Compose's `FontFamily` requires the
consumer's `Font` resources. A small extension on the consumer side bridges:

```kotlin
@Composable
fun PolymorphTextStyle.toTextStyle(): TextStyle = TextStyle(
  fontFamily = remember(fontFamily) { FontFamily(Font(/* your R.font.<family> here */)) },
  fontSize = fontSize,
  fontWeight = fontWeight,
  lineHeight = (lineHeight * fontSize.value).sp,
  letterSpacing = letterSpacing,
)

Text("Hello", style = AuroraThemeLight.typographyBody.toTextStyle())
```

## CLI

```text
polymorph transform <file> --target kotlin [--mode <mode>] [--class <Name>] [--output <path>]
```

| Flag | Default | Notes |
|---|---|---|
| `--target` | (required) | `kotlin` for this adapter (also accepts `dart`, `swift`). |
| `--mode` | `light` | Polymorph theme mode to render. |
| `--class` | `PolymorphTheme` | Name of the generated Kotlin `object`. |
| `--output` | stdout | Writes to the given path (parent dirs created). |

Invalid themes (schema or graph) exit `1` with located errors before any output is produced.

The default package declaration is `polymorph.theme`. To change it, call `transformToKotlin`
programmatically with `{ packageName: "com.example.theme" }` and write the result to the
matching directory.

## Goldens

Four reference goldens are committed under `tests/golden/` (`aurora_{light,dark}.kt`,
`borealis_{light,dark}.kt`). A vitest test regenerates each and asserts byte-equality, plus
per-converter unit tests cover edges. Regenerate after intentional changes:

```bash
pnpm --filter @polymorph/adapter-kotlin update-goldens
```

CI's drift guard runs the same generator on every PR.

> Implemented in **Spec P — Kotlin adapter (Compose codegen)**. Completes the native-platform
> triad (Flutter + Swift + Kotlin).
