# Implementation Plan: React Native Adapter

**Branch**: `003-react-native-adapter` (on `claude/compassionate-gauss-tLBN4`) | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

## Summary

`@polymorph/adapter-react-native`: a `ThemeProvider` + hooks over a `ResolvedTheme`, a `ThemeBridge`
of RN-friendly accessors, the render-slot and component-mapping registries, a retrofit `toTokenMap`
shim, and themed primitives. The neutral core (everything except `primitives.ts`) imports only
`react`/workspace packages and is unit-tested; `primitives.ts` imports `react-native` (optional
peer, ambient-typed) and is verified on-device in Spec D.

## Technical Context

**Language/Version**: TypeScript 5.7 ESM. **Deps**: `@polymorph/core`, `@polymorph/spec`
(workspace). **Peers**: `react` (>=18), `react-native` (>=0.73, **optional** so CI doesn't install
it). **Dev**: `react`, `react-test-renderer`, `@types/react`, `@types/react-test-renderer`, vitest.
**Testing**: vitest; provider/hooks via `react-test-renderer` (node, no device); pure modules
directly. **Target**: React Native (consumed by the Spec D demo). **Project Type**: monorepo library.

## Constitution Check

| Principle | Status |
|---|---|
| I. Contract-First | PASS — bridge/primitives reference `pm.*` ids only |
| II. Standards-Based | PASS — consumes `ResolvedTheme`; no token format here |
| III. Versioned vocabulary | PASS — none defined here |
| IV. Data + thin adapter / neutral output | PASS — adapter is the thin layer; `toTokenMap` keeps a neutral retrofit surface |
| V. Hybrid rendering | PASS — themed primitives default; render slots + optional role mapping are the escape hatches, never required |
| VI. Advisory a11y | PASS — lint lives in core; adapter doesn't enforce |
| VII. Conformance-gated | PASS — neutral-core unit tests; primitives feed Spec D/E |

No violations.

## Project Structure

```text
packages/adapter-react-native/
├── src/
│   ├── types/react-native.d.ts   # ambient RN subset (not emitted) so primitives typecheck w/o RN installed
│   ├── theme-bridge.ts           # neutral: accessors over ResolvedTheme
│   ├── slots.ts                  # neutral: SlotName + resolveSlot
│   ├── component-map.ts          # neutral: ComponentRegistry + resolveComponent
│   ├── retrofit.ts               # neutral: toTokenMap
│   ├── provider.ts               # react-only: ThemeProvider + hooks
│   ├── primitives.ts             # react-native: Screen/Card/ThemedText/PrimaryButton/Field/StepIndicator
│   └── index.ts                  # barrel (pulls react-native via primitives)
└── tests/                        # bridge, registries, provider (react-test-renderer)
```

**Structure Decision**: Isolate the only `react-native` import in `primitives.ts` so the rest is
testable in node. `react-native` is an **optional** peer (with `.npmrc auto-install-peers=false`)
to keep it out of CI; an ambient `react-native.d.ts` provides build/typecheck types.

## Complexity Tracking

> No violations — empty.
