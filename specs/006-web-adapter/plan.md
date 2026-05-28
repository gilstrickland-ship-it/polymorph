# Implementation Plan: Web Adapter

**Branch**: `claude/web-adapter` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

## Summary

`@polymorph/adapter-web`: a framework-agnostic CSS-vars core (emitter + bridge returning
`var(--…)` references + slot/mapping registries + retrofit shim) plus a React binding
(ThemeProvider injecting a scoped `<style>` block, hooks, themed HTML primitives). Same surface
shape as the RN adapter — proves the contract is genuinely platform-neutral.

## Technical Context

**Language/Version**: TS 5.7 ESM. **Deps**: `@polymorph/spec`, `@polymorph/core` (workspace).
**Peers**: `react` (>=18, optional so it isn't auto-installed in CI; React binding only).
**Dev**: `react`, `@types/react`, `react-test-renderer`, `@types/react-test-renderer`, `@types/node`,
`vitest`. **Testing**: vitest; provider via react-test-renderer (no DOM); pure modules direct.
**Lib**: `["ES2022", "DOM"]` (web primitives reference `HTMLInputElement` etc.).

## Constitution Check

| Principle | Status |
|---|---|
| I. Contract-First | PASS — primitives/bridge reference `pm.*` ids only |
| II. Standards-Based | PASS — consumes `ResolvedTheme`; emits standard CSS custom properties |
| III. Versioned vocabulary | PASS — none defined here |
| IV. Data + thin adapter / neutral output | PASS — adapter layers atop the neutral ResolvedTheme; `toTokenMap` keeps the retrofit surface neutral |
| V. Hybrid rendering | PASS — themed primitives default; slots + mapping are optional escape hatches |
| VI. Advisory a11y | PASS — lint lives in core; adapter doesn't enforce |
| VII. Conformance-gated | PASS — same `runThemeConformance` bar applies to themes consumed here |

No violations.

## Project Structure

```text
packages/adapter-web/
├── src/
│   ├── css-vars.ts        # toCssVarName, toCssEntries, toCssVariables, toCssVariablesString
│   ├── theme-bridge.ts    # createBridge returning var(--…) references
│   ├── slots.ts           # SlotName, SlotComponents, resolveSlot
│   ├── component-map.ts   # ComponentRegistry, resolveComponent
│   ├── retrofit.ts        # toTokenMap (concrete values)
│   ├── provider.tsx       # ThemeProvider + hooks (the only `react` import in the core)
│   ├── primitives.tsx     # Screen / Card / Stack / ThemedText / PrimaryButton / Field / StepIndicator
│   └── index.ts
└── tests/
    ├── css-vars.test.ts
    ├── theme-bridge.test.ts
    ├── registries.test.ts
    └── provider.test.ts   # react-test-renderer — provider injects <style> + scopes to wrapper
```

**Structure Decision**: One package (the framework-agnostic core + React binding). Vue / Angular /
PWA bindings will land in their own follow-up packages consuming the core. Path mapping added in
`tsconfig.base.json` for `@polymorph/adapter-web` to keep dev typecheck resolution consistent
with other workspace packages.

## Complexity Tracking

> No violations — empty.
