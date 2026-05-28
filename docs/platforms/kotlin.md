# Android / Compose (Kotlin codegen)

`@polymorph/adapter-kotlin` is **build-time codegen** for Jetpack Compose. The CLI's
`transform --target kotlin` emits a self-contained `.kt` file — two helper data classes
inlined at the top so the consumer's Android app has **no external Polymorph dependency**,
then a top-level `object` namespace with one `val` per resolved token.

## Generate

```bash
pnpm polymorph transform ./aurora.tokens.json \
  --target kotlin \
  --mode light \
  --class AuroraThemeLight \
  --output app/src/main/java/polymorph/theme/AuroraThemeLight.kt
```

Default package declaration is `polymorph.theme`; override programmatically via
`transformToKotlin(theme, { packageName: "com.example.theme" })`.

## Consume

```kotlin
import polymorph.theme.AuroraThemeLight

@Composable
fun Greeting() {
  Text(
    "Hello",
    color = AuroraThemeLight.colorTextBody,
    fontSize = AuroraThemeLight.typographyBody.fontSize,
    fontWeight = AuroraThemeLight.typographyBody.fontWeight,
    modifier = Modifier
      .padding(AuroraThemeLight.spaceMd)
      .background(AuroraThemeLight.colorSurfaceRaised),
  )
}
```

## Applying a `PolymorphTextStyle`

`fontFamily` is emitted as a plain `String` because Compose's `FontFamily` needs the
consumer's `Font` resources. A small `@Composable` extension bridges:

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

## Type mappings

| Polymorph `$type` | Kotlin / Jetpack Compose |
|---|---|
| `color` | `Color(0xFFRRGGBB)` (alpha forced to FF in v1) |
| `dimension` (spatial) | `Dp` via `.dp` (px assumed; `rem` × 16) |
| `dimension` (typography) | `TextUnit` via `.sp` |
| `number` | `Float` (with `f` suffix) |
| `duration` | `Int` milliseconds — direct input to `tween(durationMillis = …)` |
| `cubicBezier` | `CubicBezierEasing(...)` — direct input to `tween(easing = …)` |
| `typography` | `PolymorphTextStyle` (fontFamily + sizes + weight + lineHeight + tracking) |
| `shadow` | `List<PolymorphShadow>` (inset commented as unsupported) |

## View-system bridging

```kotlin
val argb = AuroraThemeLight.colorActionPrimaryRest.toArgb()
val px = with(LocalDensity.current) { AuroraThemeLight.spaceMd.toPx() }
```

## Goldens & drift guard

Four reference goldens live under `packages/adapter-kotlin/tests/golden/`. CI regenerates them
on every PR and fails on diff.
