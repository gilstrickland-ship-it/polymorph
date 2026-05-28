# Polymorph

**Design-System-Adaptive SDK Framework** — one SDK build, N design systems.

Polymorph is an open framework and open contract that lets any SDK (web or mobile) adapt to a
host application's design system **without changing the SDK per design system**. A host
financial institution (FI) supplies its design system as data (W3C DTCG tokens); the SDK
consumes that data and re-skins itself. One SDK build renders natively across many hosts.

> Status: **v1 shipped, post-v1 in flight.** The full v1 plan (contract + core + loaders + RN
> adapter + reference demo + conformance) has landed and merged. Web (CSS-vars + React + Vue +
> Solid + Angular bindings), the Tokens Studio importer, a headless golden-screenshot harness,
> and the native triad (Flutter / Swift / Kotlin build-time codegen) are also in. **19 workspace
> projects** are green on every PR; see [`specs/`](./specs) for the cycle log. Browsable docs
> live in [`docs/`](./docs) (Vitepress — `pnpm --filter @polymorph/docs dev`).

## Why

Banking-platform vendors ship features into FI digital-banking apps and must make them feel
native to each FI's UX/UI. Today that means iframes (poor on mobile) and bespoke per-FI
integration work. Polymorph replaces per-design-system SDK forks with **pure data + a thin
platform adapter**.

## How it works

The SDK is coded against a stable **semantic theme contract**, never against any FI's
primitive palette or component names. The FI's design system is transformed into that
contract, so adaptation is data-driven.

```
FI design system ─► DTCG tokens ─► Theme Loader ─► Resolution core ─► Platform adapter ─► SDK UI
```

Four token layers (DTCG-extended): **primitive** → **semantic/alias** (the contract) →
**component** (optional overrides) → **theme modes** (light / dark / highContrast).

Rendering is hybrid: token-themed SDK components by default, host **render slots** as an escape
hatch, and optional 1:1 **component mapping** as a power feature.

## What's shipped

The thesis is proven: **same SDK, two banks, zero SDK source changes**, verified headlessly +
visually.

- **The contract** (`@polymorph/spec`) — DTCG-2025.10-based schema, 68-token vocabulary
  (41 required), reserved `pm.*` namespace, modes via parallel per-mode token sets.
- **The runtime** (`@polymorph/core`, `/loaders`, `/cli`) — validate (schema + graph), resolve
  (alias chains + mode selection + component fallback → neutral `ResolvedTheme`), advisory
  WCAG 2.1 lint (handles `#hex` / `rgb()` / `hsl()` / `oklch()` / `oklab()` /
  `color(display-p3 …)`), three loaders (Inline / RemoteManifest / Bundled), and a zero-dep CLI.
- **Adapters** — React Native (`@polymorph/adapter-react-native`) and Web with CSS custom
  properties (`@polymorph/adapter-web`). Web adapter has framework bindings for **React**
  (built-in), **Vue 3** (`@polymorph/adapter-web-vue`), **Solid 1.x**
  (`@polymorph/adapter-web-solid`), and **Angular 18+** (`@polymorph/adapter-web-angular`).
  Native targets ship as build-time codegen: **Flutter / Dart** (`@polymorph/adapter-flutter`),
  **iOS / SwiftUI** (`@polymorph/adapter-swift`), **Android / Compose**
  (`@polymorph/adapter-kotlin`) — emit a self-contained source file, no Polymorph runtime in
  the consumer app.
- **The proof** — `examples/reference-sdk-onboarding` is the reference vendor SDK; the two
  mock-bank themes (`mock-bank-{aurora,borealis}`) drive it through distinct visible
  renderings, verified by `reskin.test.ts` + a static `contract-adherence.test.ts` (zero hex
  / `rgb()` / `react-native` / bank imports in the SDK source).
- **Conformance + on-device verification** — `@polymorph/conformance` ships the reusable bar
  (`runThemeConformance`, `checkResolvedInvariants`, `checkLoaderEquivalence`); the headless
  `@polymorph/golden-web` (satori → resvg → pixelmatch, no browser binary) captures and diffs
  baselines per scenario × bank × mode. Failing diffs upload as CI artifacts.
- **Authoring pipeline** — `@polymorph/authoring` imports both the single-file consolidated and
  multi-file Tokens Studio export formats into a Polymorph theme that `validateTheme` accepts.
- **CI** — GitHub Actions runs `nx run-many -t build typecheck test conformance` on every PR
  with a drift guard that fails on un-regenerated artifacts.

## Monorepo layout

| Path | Role |
|---|---|
| `packages/spec` | DTCG-extended contract — manifest, JSON Schema, TS types, `ResolvedTheme` shape |
| `packages/core` | Validator (schema + graph), alias resolver, mode selection, WCAG 2.1 lint |
| `packages/loaders` | `ThemeLoader` + Inline / RemoteManifest / Bundled loaders |
| `packages/cli` | Zero-dep `polymorph validate / lint / resolve` |
| `packages/adapter-react-native` | RN adapter: `ThemeProvider`, hooks, slots, mapping, retrofit shim, themed primitives |
| `packages/adapter-web` | Framework-agnostic web core (CSS vars + bridge) + React binding |
| `packages/adapter-web-vue` | Vue 3 binding for the web core |
| `packages/adapter-web-solid` | Solid 1.x binding for the web core |
| `packages/conformance` | Cross-adapter assertions + `GoldenHarness` interface |
| `packages/golden-web` | Pure-Node golden-screenshot harness (satori + resvg) implementing `GoldenHarness` |
| `tooling/authoring` | Tokens Studio importer (single- and multi-file consolidated exports) |
| `examples/reference-sdk-onboarding` | Reference vendor SDK — account-opening wizard coded against the contract only |
| `examples/mock-bank-{aurora,borealis}` | Two distinct DTCG token sets + host shells; differ only by the theme import |
| `specs/` | Spec Kit cycle log (one directory per spec: `spec.md`, `plan.md`, `research.md`, `contracts/`, `tasks.md`) |

## Toolchain

pnpm workspaces + [Nx](https://nx.dev). Tested with Node 22.

```bash
pnpm install
pnpm exec nx run-many -t build typecheck test conformance    # everything, with caching
pnpm exec nx run-many -t build typecheck test conformance --skip-nx-cache   # cold
pnpm conformance                                              # the reusable bar
pnpm --filter @polymorph/golden-web update-baselines          # regenerate goldens after intentional changes
```

CI runs the same commands plus a drift guard for the spec types/schemas, mock-bank themes, and
the Tokens Studio test fixture (all generated from the contract manifest).

## Specs

Polymorph is built spec-by-spec through [Spec Kit](https://github.com/github/spec-kit), one
directory per cycle under [`specs/`](./specs). Each directory contains `spec.md`, `plan.md`,
`research.md`, `contracts/`, and `tasks.md` (and is checked into the repo as a record of what
shipped and why).

Project principles live in [`.specify/memory/constitution.md`](./.specify/memory/constitution.md).

## License

[Apache-2.0](./LICENSE).
