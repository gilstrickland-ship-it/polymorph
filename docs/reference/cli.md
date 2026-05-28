# CLI

The `polymorph` CLI is the zero-dep entry point. Once `pnpm install` has run in the workspace,
invoke it via `pnpm polymorph <command>` or `pnpm exec polymorph <command>`.

```text
polymorph <validate|lint|resolve|transform> <file>
  validate/lint/resolve: [--mode <light|dark|highContrast>] [--strict] [--json]
  transform: --target <dart|swift|kotlin> [--mode <mode>] [--class <Name>] [--output <path>]
```

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | Theme is invalid (schema or graph), or `lint --strict` produced warnings. |
| `2` | Usage error (missing file, unknown command, missing required flag). |

## Commands

### `validate <file>`

Schema + alias-graph validation. Exits `1` with structured errors on any failure.

```bash
pnpm polymorph validate aurora.tokens.json
pnpm polymorph validate aurora.tokens.json --json    # machine-readable output
```

### `lint <file>`

Runs the advisory WCAG 2.1 contrast lint over a resolved snapshot. Warnings print to stderr;
exit is `0` unless `--strict` is passed.

```bash
pnpm polymorph lint aurora.tokens.json --mode dark
pnpm polymorph lint aurora.tokens.json --strict    # exit 1 on any warning
pnpm polymorph lint aurora.tokens.json --json      # machine-readable
```

### `resolve <file>`

Validates, resolves aliases, picks a mode, fills in component defaults, and prints the
`ResolvedTheme` JSON to stdout.

```bash
pnpm polymorph resolve aurora.tokens.json --mode light
```

### `transform <file>`

Build-time codegen for the native platforms. Validates first (exit 1 if invalid); requires
`--target` (exit 2 if missing); emits to stdout or writes to `--output`.

```bash
# Flutter / Dart
pnpm polymorph transform aurora.tokens.json \
  --target dart --mode light --class AuroraThemeLight \
  --output lib/polymorph_theme.dart

# iOS / SwiftUI
pnpm polymorph transform aurora.tokens.json \
  --target swift --mode light --class AuroraThemeLight \
  --output Sources/Polymorph/AuroraThemeLight.swift

# Android / Compose
pnpm polymorph transform aurora.tokens.json \
  --target kotlin --mode light --class AuroraThemeLight \
  --output app/src/main/java/polymorph/theme/AuroraThemeLight.kt
```

The `--class` flag re-maps target-appropriately: Dart `class` name, Swift `enum` name, Kotlin
`object` name.

## Common flags

| Flag | Default | Notes |
|---|---|---|
| `--mode <name>` | `light` | `light` / `dark` / `highContrast`. |
| `--strict` | off | `lint`: exit 1 on any warning. |
| `--json` | off | `validate` / `lint`: machine-readable output. |
| `--target <id>` | (required for `transform`) | `dart` / `swift` / `kotlin`. |
| `--class <Name>` | adapter-specific default | Top-level identifier in the emitted source. |
| `--output <path>` | stdout | `transform`: write to a path (parent dirs created). |

## In-process API

If you'd rather not shell out, `@polymorph/core` and the adapter packages expose the same
operations programmatically:

```ts
import { validateTheme, resolveTheme, lintTheme } from "@polymorph/core";
import { transformToDart } from "@polymorph/adapter-flutter";
import { transformToSwift } from "@polymorph/adapter-swift";
import { transformToKotlin } from "@polymorph/adapter-kotlin";
```
