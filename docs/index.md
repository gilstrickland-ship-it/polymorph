---
layout: home

hero:
  name: Polymorph
  text: One SDK build, N design systems
  tagline: An open, design-system-adaptive SDK framework. Vendors ship a single SDK. Each host bank supplies its design system as data. The SDK re-skins itself.
  actions:
    - theme: brand
      text: Get started
      link: /guide/quickstart
    - theme: alt
      text: Why Polymorph?
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/gilstrickland-ship-it/polymorph

features:
  - title: Contract-first
    details: SDKs code against a stable W3C DTCG-extended semantic vocabulary — never against any FI's primitive palette or component names. Adaptation is data, not code.
  - title: Loader governance
    details: Inline, RemoteManifest, Bundled. The remote loader composes SRI integrity + Ed25519 signature + version pin + fail-closed rollback + ETag refresh + a typed audit hook.
  - title: Web + native
    details: React, Vue, Solid, Angular, React Native, Flutter (Dart), iOS (Swift), Android (Kotlin / Compose). Native targets are build-time codegen — no Polymorph runtime in the host app.
  - title: Cross-adapter runtime parity
    details: Web CSS + Dart + Swift + Kotlin all normalised + diffed against a baseline computed directly from `resolveTheme`. Catches "every adapter wrong the same way" before any rendered snapshot does.
  - title: Three importers + a builder
    details: Hand-author DTCG, or import Tokens Studio, Figma Variables, and Figma Text/Effect Styles. `@polymorph/builder` ships headless React primitives for a visual theme editor with a working-visual playground example.
  - title: Lint, advisory + extensible
    details: Built-in WCAG 2.1 contrast across every CSS Color 4 form + motion-reduce + protected-surface floors. FIs add project-local policies via composable `PolicyPack`s without forking core.
  - title: Authoring CLI
    details: Zero-dep `polymorph` ships `validate`, `lint`, `resolve`, `transform`, `init` (scaffold), `diff` (structural compare), and `migrate` (fill newly-required tokens). CI-shaped exit codes throughout.
---

## The thesis, verified

> **Same SDK, two banks, zero SDK source changes.**

`examples/reference-sdk-onboarding` is a vendor account-opening flow coded only against the
contract. Swapping the active theme between `mock-bank-aurora` and `mock-bank-borealis`
re-skins it end-to-end — verified headlessly (golden screenshots) and structurally (a static
test asserts zero hex / `rgb()` / `react-native` / bank imports in the SDK source).

See [Vendor adoption guide](/guides/vendor) for the integration shape, or
[Quickstart](/guide/quickstart) to run it locally.
