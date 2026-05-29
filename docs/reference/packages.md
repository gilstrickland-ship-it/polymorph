# Workspace packages

The monorepo is **17 packages + docs site + 4 examples** under pnpm workspaces + Nx —
**22 Nx projects** total. Apache-2.0 across the board.

## Contract + runtime

| Package | Role |
|---|---|
| `@polymorph/spec` | DTCG-extended contract — manifest, generated JSON schema, TS types, `ResolvedTheme` shape. |
| `@polymorph/core` | Validator (schema + alias graph), alias resolver, mode selection, advisory WCAG 2.1 + motion-reduce + protected-floor lint, `applyReducedMotion`, project-local **policy packs** (`lintWithPolicies`), `parseColor`. |
| `@polymorph/loaders` | `ThemeLoader` interface + Inline / RemoteManifest / Bundled implementations. |
| `@polymorph/cli` | Zero-dep CLI: `validate` / `lint` / `resolve` / `transform` / `init` / `diff` / `migrate`. |

## Web adapters

| Package | Role |
|---|---|
| `@polymorph/adapter-web` | Framework-agnostic core: bridge + scoped `<style>` + React binding. |
| `@polymorph/adapter-web-vue` | Vue 3 binding (composables + render-function components). |
| `@polymorph/adapter-web-solid` | Solid 1.x binding (`solid-js/h` hyperscript). |
| `@polymorph/adapter-web-angular` | Angular 18+ binding (standalone components + signals). |

## Native adapters

| Package | Role |
|---|---|
| `@polymorph/adapter-react-native` | RN runtime adapter: ThemeProvider, hooks, slots, mapping, retrofit shim, themed primitives. |
| `@polymorph/adapter-flutter` | Build-time Dart codegen. No app-side runtime. |
| `@polymorph/adapter-swift` | Build-time Swift codegen. No app-side runtime. |
| `@polymorph/adapter-kotlin` | Build-time Kotlin codegen. No app-side runtime. |

## Quality

| Package | Role |
|---|---|
| `@polymorph/conformance` | Cross-adapter conformance bar: `runThemeConformance`, `checkResolvedInvariants`, `checkLoaderEquivalence`. |
| `@polymorph/golden-web` | Pure-Node golden screenshots (satori → resvg → pixelmatch). Uploads diffs as CI artifacts. |
| `@polymorph/native-parity` | Cross-adapter runtime parity: parses every adapter (Web CSS vars + Dart / Swift / Kotlin) into a normalised form and asserts equivalence against a baseline computed directly from `resolveTheme`. |

## Authoring

| Package | Role |
|---|---|
| `@polymorph/authoring` | Tokens Studio importer + Figma Variables importer + Figma Styles importer (text + effects). |
| `@polymorph/builder` | Headless React primitives for theme editing — `useThemeEditor`, typed token fields, lint panel, unstyled orchestrator. |

## Examples

| Path | Role |
|---|---|
| `examples/reference-sdk-onboarding` | Reference vendor SDK — account-opening wizard coded against the contract only. |
| `examples/mock-bank-aurora` | Mock bank A — distinct theme + host shell. |
| `examples/mock-bank-borealis` | Mock bank B — distinct theme + host shell. |
| `examples/builder-playground` | `@polymorph/builder` composed with `@polymorph/adapter-web` — Aurora theme edited live against a real component showcase. |

## Docs

| Path | Role |
|---|---|
| `docs/` | This site (Vitepress). |
| `specs/` | Spec Kit cycle log — one directory per spec (`spec.md`, `tasks.md`). |
