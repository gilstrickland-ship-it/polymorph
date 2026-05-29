# Polymorph

**Design-System-Adaptive SDK Framework** — one SDK build, N design systems.

Polymorph is an open framework and open contract that lets any SDK (web or mobile) adapt to a
host application's design system **without changing the SDK per design system**. A host
financial institution (FI) supplies its design system as data (W3C DTCG tokens); the SDK
consumes that data and re-skins itself. One SDK build renders natively across many hosts.

> Status: **v1 shipped, post-v1 in flight.** The full v1 plan (contract + core + loaders + RN
> adapter + reference demo + conformance) has landed and merged. Web (CSS-vars + React + Vue +
> Solid + Angular bindings), three importers (Tokens Studio + Figma Variables + Figma Text /
> Effect Styles), a headless golden-screenshot harness, the native triad (Flutter / Swift /
> Kotlin build-time codegen), cross-adapter **runtime parity** against the core resolved
> baseline (Web CSS + Dart + Swift + Kotlin), a production-grade `RemoteManifestLoader` (SRI
> integrity + Ed25519 signature + version pin + rollback + ETag refresh + audit hook),
> reduced-motion clamp tokens with a CSS `@media` emitter, headless React theme-builder
> primitives (`@polymorph/builder`) + a working-visual playground example, protected-surface
> floors for regulated content, project-local lint **policy packs**, and `polymorph init / diff
> / migrate` authoring commands are all in. **22 workspace projects** are green on every PR;
> see [`specs/`](./specs) for the cycle log. Browsable docs live in [`docs/`](./docs) (Vitepress —
> `pnpm --filter @polymorph/docs dev`).

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

- **The contract** (`@polymorph/spec`) — DTCG-2025.10-based schema, **70-token vocabulary
  (42 required)**, reserved `pm.*` namespace, modes via parallel per-mode token sets,
  reduced-motion clamp (`pm.motion.duration.reduced`), and a separate
  `protected-floors.v0.json` manifest for regulated-content floors.
- **The runtime** (`@polymorph/core`, `/loaders`, `/cli`) — validate (schema + graph), resolve
  (alias chains + mode selection + component fallback → neutral `ResolvedTheme`), advisory
  WCAG 2.1 lint (handles `#hex` / `rgb()` / `hsl()` / `oklch()` / `oklab()` /
  `color(display-p3 …)`, plus motion-reduce + protected-surface rule families),
  `applyReducedMotion` transform, project-local lint **policy packs** (`lintWithPolicies`
  composes built-in + FI-supplied rules), three loaders (Inline / RemoteManifest / Bundled),
  and a zero-dep CLI shipping `validate` / `lint` / `resolve` / `transform` / `init` /
  `diff` / `migrate`.
- **Remote-manifest governance** — `RemoteManifestLoader` ships opt-in SRI integrity,
  Ed25519 detached signature (with rotation), exact-`contractVersion` pin, fail-closed
  rollback to the last good theme, ETag-conditional refresh, and a typed audit event
  stream. WebCrypto-based (universal across Node / browser / Bun / Deno / workers).
- **Adapters** — React Native (`@polymorph/adapter-react-native`) and Web with CSS custom
  properties (`@polymorph/adapter-web`, with a `@media (prefers-reduced-motion: reduce)`
  emitter). Web adapter has framework bindings for **React** (built-in), **Vue 3**
  (`@polymorph/adapter-web-vue`), **Solid 1.x** (`@polymorph/adapter-web-solid`), and
  **Angular 18+** (`@polymorph/adapter-web-angular`). Native targets ship as build-time
  codegen: **Flutter / Dart** (`@polymorph/adapter-flutter`), **iOS / SwiftUI**
  (`@polymorph/adapter-swift`), **Android / Compose** (`@polymorph/adapter-kotlin`) — emit a
  self-contained source file, no Polymorph runtime in the consumer app.
- **The proof** — `examples/reference-sdk-onboarding` is the reference vendor SDK; the two
  mock-bank themes (`mock-bank-{aurora,borealis}`) drive it through distinct visible
  renderings, verified by `reskin.test.ts` + a static `contract-adherence.test.ts` (zero hex
  / `rgb()` / `react-native` / bank imports in the SDK source).
- **Conformance + on-device verification** — `@polymorph/conformance` ships the reusable bar
  (`runThemeConformance`, `checkResolvedInvariants`, `checkLoaderEquivalence`); the headless
  `@polymorph/golden-web` (satori → resvg → pixelmatch, no browser binary) captures and diffs
  baselines per scenario × bank × mode. Failing diffs upload as CI artifacts.
  `@polymorph/native-parity` parses **every adapter** (Web CSS vars + Dart + Swift + Kotlin)
  into a normalized form and asserts each agrees with a baseline computed directly from
  `resolveTheme` — catches "all adapters wrong the same way" before any rendered snapshot
  does.
- **Authoring pipeline** — `@polymorph/authoring` ships **three importers**: Tokens Studio
  (single- + multi-file), Figma Variables, and Figma Styles (text + effects). Each produces
  a Polymorph theme that `validateTheme` accepts; the importers compose for orgs whose
  tokens live entirely in Figma.
- **Theme builder** — `@polymorph/builder` ships headless React primitives for a visual
  theme editor: `useThemeEditor` state hook (dirty tracking + live lint), typed token
  fields (color / dimension / duration / number / cubicBezier), accessible `LintPanel`,
  unstyled `ThemeEditorRoot` orchestrator. Visual chrome stays the host's job. A working
  composition with the Web adapter's themed primitives lives in `examples/builder-playground`.
- **CI** — GitHub Actions runs `nx run-many -t build typecheck test conformance` on every PR
  with a drift guard that fails on un-regenerated artifacts.

## Monorepo layout

| Path | Role |
|---|---|
| `packages/spec` | DTCG-extended contract — manifest, `protected-floors.v0.json`, JSON Schema, TS types, `ResolvedTheme` shape, reduced-motion tokens |
| `packages/core` | Validator (schema + graph), alias resolver, mode selection, WCAG 2.1 + motion-reduce + protected-floor lint, `applyReducedMotion`, policy-pack composition |
| `packages/loaders` | `ThemeLoader` + Inline / RemoteManifest (SRI + signature + version pin + rollback + ETag + audit) / Bundled |
| `packages/cli` | Zero-dep `polymorph validate / lint / resolve / transform / init / diff / migrate` |
| `packages/adapter-react-native` | RN adapter: `ThemeProvider`, hooks, slots, mapping, retrofit shim, themed primitives |
| `packages/adapter-web` | Framework-agnostic web core (CSS vars + bridge + `@media (prefers-reduced-motion)` emitter) + React binding |
| `packages/adapter-web-vue` | Vue 3 binding for the web core |
| `packages/adapter-web-solid` | Solid 1.x binding for the web core |
| `packages/adapter-web-angular` | Angular 18+ binding (standalone components + signals) |
| `packages/adapter-flutter` | Build-time Dart codegen. No app-side runtime |
| `packages/adapter-swift` | Build-time Swift / SwiftUI codegen |
| `packages/adapter-kotlin` | Build-time Kotlin / Compose codegen |
| `packages/conformance` | Cross-adapter assertions + `GoldenHarness` interface |
| `packages/golden-web` | Pure-Node golden-screenshot harness (satori + resvg) implementing `GoldenHarness` |
| `packages/native-parity` | Cross-adapter **runtime parity** — Web CSS + Dart + Swift + Kotlin all normalized + diffed against a baseline computed directly from `resolveTheme` |
| `packages/builder` | Headless React primitives for theme editing — `useThemeEditor`, typed token fields, lint panel, unstyled orchestrator |
| `tooling/authoring` | Three importers: Tokens Studio (single + multi-file), Figma Variables, Figma Styles (text + effects) |
| `examples/reference-sdk-onboarding` | Reference vendor SDK — account-opening wizard coded against the contract only |
| `examples/mock-bank-{aurora,borealis}` | Two distinct DTCG token sets + host shells; differ only by the theme import |
| `examples/builder-playground` | `@polymorph/builder` composed with `@polymorph/adapter-web` — Aurora theme edited live against a real component showcase |
| `docs/` | This site (Vitepress) |
| `specs/` | Spec Kit cycle log (one directory per spec: `spec.md`, `tasks.md`, etc.) |

## Installation (for hosts adopting Polymorph)

Once a host application (vendor SDK or FI portal) adopts Polymorph, they install only the
packages they need. The contract + runtime is small; adapters are picked per platform.

```bash
# Always: the contract types + runtime + loaders + CLI
npm install @polymorph/spec @polymorph/core @polymorph/loaders
npm install --save-dev @polymorph/cli

# Pick the adapter(s) you ship against
npm install @polymorph/adapter-web                # React (built-in) + framework-agnostic CSS-vars core
npm install @polymorph/adapter-web-vue            # Vue 3 binding
npm install @polymorph/adapter-web-solid          # Solid 1.x
npm install @polymorph/adapter-web-angular        # Angular 18+
npm install @polymorph/adapter-react-native       # React Native
# Native build-time codegen — used at build time, no runtime dependency
npm install --save-dev @polymorph/adapter-flutter @polymorph/adapter-swift @polymorph/adapter-kotlin

# Optional authoring + editing
npm install --save-dev @polymorph/authoring       # Tokens Studio / Figma Variables / Figma Styles importers
npm install @polymorph/builder                    # Headless React theme-editor primitives

# Optional CI gates
npm install --save-dev @polymorph/conformance @polymorph/native-parity
```

Once installed, the CLI is invocable directly:

```bash
npx polymorph validate path/to/theme.tokens.json
npx polymorph lint path/to/theme.tokens.json --mode dark --strict
npx polymorph resolve path/to/theme.tokens.json --mode dark
npx polymorph init --output theme.tokens.json --modes light,dark
npx polymorph migrate theme.tokens.json --output theme.next.tokens.json
npx polymorph diff a.json b.json
npx polymorph transform theme.tokens.json --target dart --output lib/theme.dart
```

See [`docs/reference/cli.md`](docs/reference/cli.md) for the full command surface and
[`docs/guides/`](docs/guides/) for the vendor / FI / SDK integration walkthroughs.

## Toolchain (for contributors)

pnpm workspaces + [Nx](https://nx.dev). Tested with Node 22. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the full contributor guide.

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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development loop, spec-driven workflow,
and PR-shape guidance.

## Security

Use the private disclosure path documented in [SECURITY.md](./SECURITY.md). Do not open
public issues for vulnerabilities.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md). Pre-1.0 cycle-by-cycle history lives in
[`specs/`](./specs).

## License

[Apache-2.0](./LICENSE).
