# Quickstart

This walk-through clones the monorepo and runs the reference demo on web, headlessly.

## Prerequisites

- Node 22
- pnpm 10

## Clone & install

```bash
git clone https://github.com/gilstrickland-ship-it/polymorph.git
cd polymorph
pnpm install
```

## Validate a theme

```bash
pnpm polymorph validate examples/mock-bank-aurora/theme/aurora.tokens.json
# ✓ valid
pnpm polymorph lint examples/mock-bank-aurora/theme/aurora.tokens.json
# advisory WCAG 2.1 warnings (non-blocking by default; --strict exits 1 on warn)
```

## Resolve a theme

`resolve` selects a mode, follows alias chains, falls back component defaults, and emits a
neutral `ResolvedTheme` JSON:

```bash
pnpm polymorph resolve examples/mock-bank-borealis/theme/borealis.tokens.json --mode dark
```

## Transform for a native platform

The CLI's `transform` command runs a build-time codegen for Flutter / SwiftUI / Compose:

```bash
# Flutter
pnpm polymorph transform examples/mock-bank-aurora/theme/aurora.tokens.json \
  --target dart --mode light --class AuroraThemeLight \
  --output lib/polymorph_theme.dart

# iOS / SwiftUI
pnpm polymorph transform examples/mock-bank-aurora/theme/aurora.tokens.json \
  --target swift --mode light --class AuroraThemeLight \
  --output Sources/Polymorph/AuroraThemeLight.swift

# Android / Compose
pnpm polymorph transform examples/mock-bank-aurora/theme/aurora.tokens.json \
  --target kotlin --mode light --class AuroraThemeLight \
  --output app/src/main/java/polymorph/theme/AuroraThemeLight.kt
```

Each emits a self-contained file — drop it into your platform build, no Polymorph runtime
dependency required.

## Run the whole workspace

```bash
pnpm exec nx run-many -t build typecheck test conformance --skip-nx-cache
```

That builds every package, runs the conformance bar against every adapter, and regenerates
the golden screenshots for the web reference demo.

## Next

- [The semantic vocabulary](/guide/semantic-vocabulary) — what the SDK can target.
- [Vendor adoption guide](/guides/vendor) — how an SDK author wires Polymorph into a feature.
- [FI authoring guide](/guides/fi) — how a bank authors and delivers its theme.
