# Flutter (Dart codegen)

`@polymorph/adapter-flutter` is **build-time codegen** — there is no JS runtime in the host
app. The CLI's `transform --target dart` emits a self-contained `.dart` file that the
consumer's Flutter build compiles.

## Generate

```bash
pnpm polymorph transform ./aurora.tokens.json \
  --target dart \
  --mode light \
  --class AuroraThemeLight \
  --output lib/polymorph_theme.dart
```

## Consume

```dart
import 'package:flutter/material.dart';
import 'polymorph_theme.dart';

void main() => runApp(MaterialApp(
  theme: AuroraThemeLight.buildThemeData(),
  home: MyApp(),
));

// Or grab individual tokens
Container(
  color: AuroraThemeLight.colorSurfaceRaised,
  padding: EdgeInsets.all(AuroraThemeLight.spaceMd),
)
```

## What the file contains

A single class with one `static const` per resolved semantic + component token plus an
opinionated `static ThemeData buildThemeData()` factory that maps the standard semantics onto
Material 3's `ThemeData` / `ColorScheme` / `TextTheme`.

```dart
class AuroraThemeLight {
  // ---- Colors ----------------------------------------------------------------
  static const Color colorSurfaceBase = Color(0xFFFFFFFF);
  static const Color colorActionPrimaryRest = Color(0xFF1F5CFF);
  // ...

  // ---- Typography ------------------------------------------------------------
  static const TextStyle typographyBody = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w400,
    fontSize: 16.0,
    height: 1.4,
    letterSpacing: 0.0,
  );
  // ...

  // ---- Component tokens (override resolved) ----------------------------------
  static const Color buttonPrimaryBackground = Color(0xFF1F5CFF);
  static const double buttonPrimaryRadius = 10.0;

  static ThemeData buildThemeData() { /* opinionated mapping */ }
}
```

## Type mappings

| Polymorph `$type` | Dart |
|---|---|
| `color` | `Color(0xFFRRGGBB)` (alpha forced to FF in v1) |
| `dimension` | `double` (px assumed; `rem` × 16) |
| `number` | `double` |
| `duration` | `Duration(milliseconds: …)` / `Duration(seconds: …)` |
| `cubicBezier` | `Cubic(x1, y1, x2, y2)` |
| `typography` | `TextStyle(...)` |
| `shadow` | `List<BoxShadow>` (inset commented as unsupported) |

## Goldens & drift guard

Four reference goldens live under `packages/adapter-flutter/tests/golden/`. CI regenerates
them from the bank fixtures on every PR and fails on any diff — catches "edited the manifest
or generator but forgot to regenerate."
