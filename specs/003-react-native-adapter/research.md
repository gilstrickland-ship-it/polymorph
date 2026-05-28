# Phase 0 Research: React Native Adapter

## R1 — Testing RN logic without a device

**Decision**: Split the package so the **neutral core** (bridge, provider/hooks, slots, mapping,
retrofit) imports only `react` + workspace packages and is unit-tested in node; provider/hooks are
exercised with **react-test-renderer** (renders to a tree with no host components). The themed
**primitives** are the sole `react-native` importer and are verified on-device in Spec D.

**Rationale**: The cloud container has no RN runtime; importing `react-native` in node throws. This
split keeps the bulk of the adapter green in CI while still shipping real primitives.

**Alternatives**: Mock `react-native` to test primitives (asserts against a mock, weak signal —
rejected); defer all primitives to Spec D (chosen against — primitives belong with the adapter).

## R2 — `react-native` types without installing it

**Decision**: Declare `react-native` an **optional peer dependency** and set
`auto-install-peers=false` in the root `.npmrc`, so pnpm does not pull RN (and its React 19 peer
cascade) into CI. A small ambient `src/types/react-native.d.ts` declares the subset the primitives
use (`View`, `Text`, `Pressable`, `TextInput`, `StyleSheet`, style/prop types). The shim is a
`.d.ts` (not emitted), so published types reference the consumer's real `react-native`.

**Rationale**: Installing RN 0.85 forced React 19 and a large native dependency tree, conflicting
with the React 18 used by react-test-renderer. The optional-peer + ambient-shim pattern is a
standard way for RN libraries to typecheck in headless CI.

## R3 — `ThemeBridge` shape

**Decision**: `createBridge(resolved)` returns typed accessors — `color(id)`, `dim(id)` (dimension
→ number), `num(id)`, `typography(id)` (composite → RN `TextStyle`-shaped), `has(id)` — throwing a
located "missing token" error on absent ids. Pure and framework-free.

**Rationale**: Primitives need ergonomic, typed reads; throwing on absence surfaces misuse early.
The bridge stays neutral so a retrofit/host can use it too.

## R4 — Provider via React context

**Decision**: `ThemeProvider` memoizes `{ theme, bridge, slots, components }` into context; hooks
(`useTheme`, `useThemeBridge`, `useResolvedTheme`, `useSlot`, `useThemedComponent`) read it.
`useTheme` throws outside a provider.
