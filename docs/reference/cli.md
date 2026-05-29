# CLI

The `polymorph` CLI is the zero-dep entry point. Once `pnpm install` has run in the workspace,
invoke it via `pnpm polymorph <command>` or `pnpm exec polymorph <command>`.

```text
polymorph <command> [options]
  validate <file>                      schema + alias-graph check
  lint <file>                          advisory WCAG / motion / protected checks
  resolve <file>                       print the resolved theme as JSON
  transform <file>                     emit native source for a target
  init                                 scaffold a minimal valid theme
  diff <before> <after>                structural diff between two themes
  migrate <file>                       fill in missing required tokens + bump contractVersion

  shared:        [--mode <light|dark|highContrast>] [--json]
  lint:          [--strict]
  transform:     --target <dart|swift|kotlin> [--class <Name>] [--output <path>]
  init/migrate:  [--output <path>]
  init:          [--modes <comma-separated>]
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

### `init`

Scaffolds a minimal **valid** theme synthesised from the live manifest. Every required
token is present with a placeholder value (intentionally identical colours so the lint
visibly warns — that's the signal for "go customise this"). `--modes` populates the
mode-sensitive set under each listed mode.

```bash
pnpm polymorph init                              # print to stdout
pnpm polymorph init --output theme.tokens.json   # write to file
pnpm polymorph init --modes light,dark           # populate both modes
```

### `diff <before> <after>`

Structural diff between two theme files. Walks the `pm.*` subtree and reports added /
removed / changed authored tokens by dotted path. Exits `0` on identity, `1` on any
change — useful as a CI gate against an approved baseline.

```bash
pnpm polymorph diff aurora.tokens.json aurora.next.tokens.json
pnpm polymorph diff a.json b.json --json    # machine-readable
```

### `migrate <file>`

Conservative theme upgrade: fills in any required tokens introduced since the file was
authored (with placeholder values), bumps `contractVersion`. Never rewrites the user's
authored values, never removes tokens. Use `--output` to write the migrated theme.

```bash
pnpm polymorph migrate aurora.tokens.json --output aurora.upgraded.tokens.json
pnpm polymorph migrate aurora.tokens.json --json    # report-only, no rewrite
```

## Common flags

| Flag | Default | Notes |
|---|---|---|
| `--mode <name>` | `light` | `light` / `dark` / `highContrast`. |
| `--modes <list>` | `light` | `init`: comma-separated list of modes to populate. |
| `--strict` | off | `lint`: exit 1 on any warning. |
| `--json` | off | `validate` / `lint` / `diff` / `migrate`: machine-readable output. |
| `--target <id>` | (required for `transform`) | `dart` / `swift` / `kotlin`. |
| `--class <Name>` | adapter-specific default | Top-level identifier in the emitted source. |
| `--output <path>` | stdout | `transform` / `init` / `migrate`: write to a path (parent dirs created). |

## In-process API

If you'd rather not shell out, `@polymorph/core` and the adapter packages expose the same
operations programmatically:

```ts
import { validateTheme, resolveTheme, lintTheme } from "@polymorph/core";
import { transformToDart } from "@polymorph/adapter-flutter";
import { transformToSwift } from "@polymorph/adapter-swift";
import { transformToKotlin } from "@polymorph/adapter-kotlin";
```
