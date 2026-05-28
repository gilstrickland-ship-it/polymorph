# @polymorph/adapter-flutter

Build-time codegen from a Polymorph theme to a Dart `PolymorphTheme` class — **no Dart toolchain
required.** Emits text; the consumer's Flutter build compiles the output.

```bash
# Via the CLI
polymorph transform ./aurora.tokens.json --target dart --mode light \
  --class AuroraThemeLight --output lib/polymorph_theme.dart

# Or programmatically
import { transformToDart } from "@polymorph/adapter-flutter";
const dart = transformToDart(themeJson, { mode: "light", className: "AuroraThemeLight" });
```

## What you get

A single `.dart` file declaring one class with one `static const` per resolved semantic and
component token, plus an opinionated `buildThemeData()` factory mapping them onto Flutter's
`ThemeData`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter/animation.dart';

class AuroraThemeLight {
  // ---- Colors ----------------------------------------------------------------
  static const Color colorSurfaceBase = Color(0xFFFFFFFF);
  static const Color colorActionPrimaryRest = Color(0xFF1F5CFF);
  // ... 28 more

  // ---- Dimensions / spacing / radii / sizes ----------------------------------
  static const double spaceMd = 16.0;
  static const double radiusControl = 10.0;
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

  // ---- Motion (durations + easings) ------------------------------------------
  static const Duration motionDurationBase = Duration(milliseconds: 220);
  static const Cubic motionEasingStandard = Cubic(0.4, 0.0, 0.2, 1.0);

  // ---- Shadows ---------------------------------------------------------------
  static const List<BoxShadow> elevationRaised = <BoxShadow>[
    BoxShadow(color: Color(0xFF000000), offset: Offset(0.0, 2.0), blurRadius: 6.0, spreadRadius: 0.0),
  ];

  // ---- Component tokens (override resolved) ----------------------------------
  static const Color buttonPrimaryBackground = Color(0xFF1F5CFF);
  static const double buttonPrimaryRadius = 10.0;
  // ...

  static ThemeData buildThemeData() {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: colorSurfaceBase,
      cardColor: colorSurfaceRaised,
      primaryColor: colorActionPrimaryRest,
      colorScheme: ColorScheme.light(
        primary: colorActionPrimaryRest, onPrimary: colorTextOnAction,
        secondary: colorActionSecondaryRest, error: colorActionDangerRest, surface: colorSurfaceBase,
      ),
      textTheme: TextTheme(
        headlineMedium: typographyHeading, bodyLarge: typographyBody,
        labelLarge: typographyLabel, bodySmall: typographyCaption,
      ),
    );
  }
}
```

## Type mappings

| Polymorph `$type` | Dart |
|---|---|
| `color` (any CSS Color 4 form) | `Color(0xFFRRGGBB)` (alpha forced to FF in v1; OKLab/display-p3 converted to sRGB via `@polymorph/core.parseColor`) |
| `dimension` | `double` (px assumed; `rem` × 16) |
| `number` | `double` |
| `duration` | `Duration(milliseconds: …)` / `Duration(seconds: …)` |
| `cubicBezier` | `Cubic(x1, y1, x2, y2)` |
| `typography` composite | `TextStyle(fontFamily, fontWeight: FontWeight.w<N>, fontSize, height, letterSpacing)` |
| `shadow` (single or array) | `List<BoxShadow>` (inset isn't representable on `BoxShadow`; commented inline if present) |

Component-token roles emit constants with camelCased role + property names (`buttonPrimaryBackground`,
`inputBorderFocus`, etc.). The `defaultsFrom` resolution has already been applied during
`resolveTheme`, so each property has a concrete value.

## CLI

```text
polymorph transform <file> --target dart [--mode <mode>] [--class <ClassName>] [--output <path>]
```

| Flag | Default | Notes |
|---|---|---|
| `--target` | (required) | `dart` is the only target today. |
| `--mode` | `light` | Polymorph theme mode to render. |
| `--class` | `PolymorphTheme` | Name of the generated Dart class. |
| `--output` | stdout | Writes to the given path (parent dirs created). |

Invalid themes (schema or graph) exit `1` with located errors before any output is produced.

## Goldens

Four reference goldens are committed under `tests/golden/` (`aurora_{light,dark}.dart`,
`borealis_{light,dark}.dart`). A vitest test regenerates each and asserts byte-equality, plus
per-converter unit tests cover edges. Regenerate after intentional changes:

```bash
pnpm --filter @polymorph/adapter-flutter update-goldens
```

CI's drift guard runs the same generator on every PR.

> Implemented in **Spec N — Flutter adapter (Dart codegen)**. iOS/Android native adapters can
> follow the same shape (CLI `transform --target swift` / `--target kotlin`).
