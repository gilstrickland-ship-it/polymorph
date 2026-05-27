# Polymorph

**Design-System-Adaptive SDK Framework** — one SDK build, N design systems.

Polymorph is an open framework and open contract that lets any SDK (web or mobile) adapt to a
host application's design system **without changing the SDK per design system**. A host
financial institution (FI) supplies its design system as data (W3C DTCG tokens); the SDK
consumes that data and re-skins itself. One SDK build renders natively across many hosts.

> Status: **pre-v1, greenfield.** The work is sequenced through [Spec Kit](https://github.com/github/spec-kit),
> starting with the token/theme contract. See the approved plan and the spec decomposition below.

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

## Monorepo layout

| Path | Role |
|---|---|
| `packages/spec` | DTCG-extended schema + semantic vocabulary + JSON Schema (the standard) |
| `packages/core` | Validator, advisory a11y linter, alias resolver, mode selection |
| `packages/loaders` | `ThemeLoader` interface + Inline / RemoteManifest / Bundled loaders |
| `packages/adapter-react-native` | First adapter: ThemeProvider, slots, component-mapping registry |
| `packages/conformance` | Cross-adapter fixtures, assertions, golden-screenshot harness |
| `packages/cli` | `validate` / `lint` / `resolve` (token transform wraps Style Dictionary) |
| `examples/reference-sdk-onboarding` | Reference vendor "account opening" feature, coded against the contract only |
| `examples/mock-bank-aurora`, `examples/mock-bank-borealis` | Two distinct mock-bank token sets + host RN shells |
| `tooling/authoring` | (sequenced) Figma / Tokens Studio import, auto-extract, theme builder |
| `docs` | Standard spec site + vendor/FI adoption guides |

## v1 scope

React Native vertical slice that proves the thesis: swapping the reference SDK between two mock
banks is a **theme/token change only — zero edits to SDK source** — and conformance + lint pass
for both. Web, Flutter, and native iOS/Android adapters follow post-v1.

## Toolchain

pnpm workspaces + [Nx](https://nx.dev). `pnpm build | test | lint | conformance | typecheck`.

## License

[Apache-2.0](./LICENSE).
