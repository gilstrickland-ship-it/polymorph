# Contract: `@polymorph/conformance` API

```ts
import type { ResolvedTheme, ThemeMode } from "@polymorph/spec";

export interface ConformanceCheck { name: string; passed: boolean; detail?: string }
export interface ConformanceReport { passed: boolean; checks: ConformanceCheck[] }

// Theme-level bar: validity (schema + graph) + per-mode resolution invariants.
export function runThemeConformance(theme: unknown): ConformanceReport;
// Throws an error listing failed checks; for adapter/theme test suites.
export function assertConforms(theme: unknown, label?: string): void;
// Invariants for a single resolved theme (required present, no aliases, pm-only keys, fallback).
export function checkResolvedInvariants(resolved: ResolvedTheme): ConformanceCheck[];
// Inline / Bundled / RemoteManifest resolve the same theme deep-equal.
export function checkLoaderEquivalence(theme: unknown, mode?: ThemeMode): Promise<ConformanceCheck>;

// Golden-screenshot conformance (implemented per-adapter on a platform renderer).
export interface GoldenHarness {
  capture(name: string, tree: unknown): Promise<Uint8Array>;
  compare(name: string, actual: Uint8Array): Promise<{ match: boolean; diffRatio: number }>;
}
export class GoldenHarnessUnavailableError extends Error {}
export const headlessGoldenHarness: GoldenHarness; // throws — pixel capture needs a renderer
```

## Invariants asserted (per mode)

- **required tokens present** — every `REQUIRED_TOKEN_ID` exists in `resolved.tokens`.
- **no aliases remain** — no value is a `{...}` reference.
- **pm-only token keys** — no foreign/primitive keys leak into the resolved map.
- **component roles resolved** — each role's properties resolve (override or `defaultsFrom`).

## Usage in an adapter

```ts
import { assertConforms } from "@polymorph/conformance";
assertConforms(myBankTheme, "my-bank"); // in the adapter's test suite
```
