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
  - title: Conformance + goldens
    details: Cross-adapter conformance bar, per-adapter golden-screenshot harness, cross-codegen parity check for the three native targets. Catches divergence before it ships.
  - title: Three importers + a builder
    details: Hand-author DTCG, or import Tokens Studio, Figma Variables, and Figma Text/Effect Styles. `@polymorph/builder` ships headless React primitives for a visual theme editor.
  - title: Advisory a11y + protected surfaces
    details: WCAG 2.1 contrast linting across every CSS Color 4 form, motion-reduce clamp tokens with a CSS `@media` emitter, stricter floors for regulator-mandated copy (legal disclosures). Hosts own final compliance.
---

## The thesis, verified

> **Same SDK, two banks, zero SDK source changes.**

`examples/reference-sdk-onboarding` is a vendor account-opening flow coded only against the
contract. Swapping the active theme between `mock-bank-aurora` and `mock-bank-borealis`
re-skins it end-to-end — verified headlessly (golden screenshots) and structurally (a static
test asserts zero hex / `rgb()` / `react-native` / bank imports in the SDK source).

See [Vendor adoption guide](/guides/vendor) for the integration shape, or
[Quickstart](/guide/quickstart) to run it locally.
