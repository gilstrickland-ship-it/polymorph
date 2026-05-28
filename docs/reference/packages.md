# Workspace packages

The monorepo is **18 packages + examples** under pnpm workspaces + Nx. Apache-2.0 across the
board.

## Contract + runtime

| Package | Role |
|---|---|
| `@polymorph/spec` | DTCG-extended contract — manifest, generated JSON schema, TS types, `ResolvedTheme` shape. |
| `@polymorph/core` | Validator (schema + alias graph), alias resolver, mode selection, advisory WCAG 2.1 lint, `parseColor`. |
| `@polymorph/loaders` | `ThemeLoader` interface + Inline / RemoteManifest / Bundled implementations. |
| `@polymorph/cli` | Zero-dep CLI: `validate` / `lint` / `resolve` / `transform`. |

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

## Authoring

| Package | Role |
|---|---|
| `@polymorph/authoring` | Tokens Studio importer (single- and multi-file formats). |

## Examples

| Path | Role |
|---|---|
| `examples/reference-sdk-onboarding` | Reference vendor SDK — account-opening wizard coded against the contract only. |
| `examples/mock-bank-aurora` | Mock bank A — distinct theme + host shell. |
| `examples/mock-bank-borealis` | Mock bank B — distinct theme + host shell. |

## Docs

| Path | Role |
|---|---|
| `docs/` | This site (Vitepress). |
| `specs/` | Spec Kit cycle log — one directory per spec (`spec.md`, `tasks.md`). |
