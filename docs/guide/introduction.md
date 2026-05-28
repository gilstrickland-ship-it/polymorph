# Introduction

## The problem

Banking-platform vendors ship features into FI digital-banking apps and must make them feel
native to each FI's UX/UI. Today that means iframes (poor on mobile) and bespoke per-FI
integration work for every vendor, every design system, every platform. The combinatorics are
ugly: *N* vendors × *M* FIs × *P* platforms = *NMP* integrations.

## The thesis

> The SDK is coded against a stable **semantic theme contract**, never against any FI's
> primitive palette or component names. The FI's design system is transformed into that
> contract. Adaptation is therefore **pure data + a thin platform adapter** — *N + M + P*
> instead of *NMP*.

```
FI design system ─► DTCG tokens ─► Theme Loader ─► Resolution core ─► Platform adapter ─► SDK UI
```

## What the contract is

Four token layers (DTCG-extended):

1. **Primitive** — raw palette, type scale, spacing scale. FI-specific. The SDK never references
   these directly.
2. **Semantic / alias** — the contract. Purpose-named tokens like
   `pm.color.surface.base`, `pm.color.action.primary.rest`, `pm.typography.body`,
   `pm.motion.duration.base`. **This is the only thing the SDK targets.**
3. **Component** — optional per-role overrides (`button.primary.background`,
   `input.border.focus`) that *default to* a semantic token.
4. **Theme modes** — `light` / `dark` / `highContrast` variants colocated in one file.

The vocabulary is finite, stable, and versioned. Adding tokens is the only safe change.

## Hybrid rendering

- **Themed components (default)** — the SDK ships and renders its own components, styled
  entirely from resolved semantic + component tokens.
- **Render slots** — named override points (`Header`, `PrimaryButton`, `Field`, `StepIndicator`,
  `Disclosure`). The host may inject its own component; default is the themed SDK component.
- **Component mapping (optional power feature)** — a registry mapping SDK component *roles* →
  host component-library entries, for FIs with a formal component library on a platform.

## Platform coverage today

| Platform | Adapter | Surface |
|---|---|---|
| Web (CSS vars) | `@polymorph/adapter-web` | Framework-agnostic core + React |
| Vue 3 | `@polymorph/adapter-web-vue` | Composables + render-function components |
| Solid 1.x | `@polymorph/adapter-web-solid` | `solid-js/h` primitives |
| Angular 18+ | `@polymorph/adapter-web-angular` | Standalone components + signals |
| React Native | `@polymorph/adapter-react-native` | Context + `StyleSheet` |
| Flutter | `@polymorph/adapter-flutter` | Build-time Dart codegen — no JS runtime in the app |
| iOS / SwiftUI | `@polymorph/adapter-swift` | Build-time Swift codegen |
| Android / Compose | `@polymorph/adapter-kotlin` | Build-time Kotlin codegen |

Native targets are **codegen-only** — emit a self-contained source file (no Polymorph runtime
dependency on the consumer side), compiled by the consumer's platform build.

## Accessibility posture

**Advisory.** `pnpm polymorph lint` flags WCAG 2.1 contrast issues across every CSS Color 4
form and surface-vs-text pair. Hosts own final compliance; the linter exists to fail loud.
