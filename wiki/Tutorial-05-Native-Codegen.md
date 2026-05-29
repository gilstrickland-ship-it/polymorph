# Tutorial 05 — Generate native Dart / Swift / Kotlin source

**Time**: ~10 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate), a valid `theme.tokens.json`.

Native targets are **codegen-only** — the adapters emit a self-contained source file
that compiles into your app. There's no Polymorph runtime in the consumer.

---

## Install

```bash
npm install --save-dev @polymorph/adapter-flutter @polymorph/adapter-swift @polymorph/adapter-kotlin
```

## Generate each target

```bash
# Flutter / Dart
npx polymorph transform theme.tokens.json \
  --target dart \
  --mode light \
  --class MyBankThemeLight \
  --output lib/theme/mybank_theme_light.dart

# iOS / SwiftUI
npx polymorph transform theme.tokens.json \
  --target swift \
  --mode light \
  --class MyBankThemeLight \
  --output Sources/MyBank/MyBankThemeLight.swift

# Android / Compose
npx polymorph transform theme.tokens.json \
  --target kotlin \
  --mode light \
  --class MyBankThemeLight \
  --output app/src/main/java/mybank/theme/MyBankThemeLight.kt
```

Output is deterministic — same input always yields byte-identical output. Run them in
your build (e.g. as a `predart` script, an Xcode build phase, or a Gradle task).

## Consume on iOS / SwiftUI

```swift
import SwiftUI

struct MyView: View {
  var body: some View {
    Text("Hello")
      .foregroundColor(MyBankThemeLight.colorTextBody)
      .padding(MyBankThemeLight.spaceMd)
      .background(MyBankThemeLight.colorSurfaceRaised)
      .cornerRadius(MyBankThemeLight.radiusCard)
  }
}
```

## Consume on Android / Compose

```kotlin
import androidx.compose.material3.Text
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.graphics.Color

@Composable
fun MyView() {
  Text(
    text = "Hello",
    color = Color(MyBankThemeLight.colorTextBody),
    modifier = Modifier.padding(MyBankThemeLight.spaceMd.dp),
  )
}
```

## Consume on Flutter / Dart

```dart
Container(
  padding: EdgeInsets.all(MyBankThemeLight.spaceMd),
  color: MyBankThemeLight.colorSurfaceRaised,
  child: Text(
    'Hello',
    style: TextStyle(color: MyBankThemeLight.colorTextBody),
  ),
)
```

## Generating both modes

```bash
npx polymorph transform theme.tokens.json --target swift --mode light --class MyBankThemeLight --output Sources/MyBank/MyBankThemeLight.swift
npx polymorph transform theme.tokens.json --target swift --mode dark  --class MyBankThemeDark  --output Sources/MyBank/MyBankThemeDark.swift
```

Then in your app code, swap at runtime based on `UITraitCollection.userInterfaceStyle`.

## Verifying cross-platform consistency

```ts
// CI: assert every native adapter agrees with the core resolution
import { assertRuntimeParity } from "@polymorph/native-parity";
import theme from "./theme.tokens.json";

assertRuntimeParity(theme, "light", "mybank");
assertRuntimeParity(theme, "dark",  "mybank");
```

If a future Polymorph release introduces a bug where Swift rounds a value differently
than Dart, this assertion catches it before your goldens diverge. See
[Tutorial 12 — Conformance & parity](Tutorial-12-Conformance-And-Parity).

## What's next

- [Tutorial 12 — Conformance & parity](Tutorial-12-Conformance-And-Parity) for CI gating
- [Report R3 — Adapter coverage](Report-03-Adapter-Coverage) — two real codegen bugs the Primer integration uncovered + fixed
