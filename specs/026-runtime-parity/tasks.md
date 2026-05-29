---

description: "Task list for Spec Z — cross-adapter runtime parity"
---

# Tasks: Cross-Adapter Runtime Parity

**Input**: Design documents from `specs/026-runtime-parity/`.

## Phase 1: Core baseline (FR-001)

- [x] T001 `packages/native-parity/src/normalize-resolved.ts`: `normalizeResolved(rt, opts?)` walks `rt.tokens` and emits camelCase keys matching the native parsers' naming. Optional `includeComponents` walks `rt.components` and emits role-flat constants (`buttonPrimaryBackground` etc.).
- [x] T002 Helper `idToCamelName("pm.color.surface.base") → "colorSurfaceBase"`.
- [x] T003 Helper `roleToCamelName("button.primary", "background") → "buttonPrimaryBackground"`.
- [x] T004 Component-property type inference by shape (color hex, `{value, unit}` for dimension/duration, 4-number array for cubicBezier, typography composite, single / array shadow).

## Phase 2: Web adapter parser (FR-002 / FR-003)

- [x] T005 `packages/native-parity/src/parse-css-vars.ts`: `parseCssVars(vars)` walks the CSS-var record, dispatches on value shape (color / duration / cubic-bezier / dimension / number / shadow), and accumulates typography sub-vars by base-name into composites.
- [x] T006 Bare numbers (no unit) classify as `number`, not `dimension` — required so opacity tokens don't mis-classify as 0.4px.
- [x] T007 Shadow parser splits comma-separated multi-shadow CSS at top-level (parens-aware) and reads `<ox> <oy> <blur>` + trailing color hex.

## Phase 3: Orchestrator (FR-004 / FR-005)

- [x] T008 `packages/native-parity/src/runtime-parity.ts`: `checkRuntimeParity(theme, mode)` resolves theme; scopes baseline per adapter (Web sees `includeComponents: false`; native sees `true`); runs each adapter's transform + parser; diffs.
- [x] T009 `assertRuntimeParity(theme, mode, label?)` throws a readable error with `adapter: N mismatches` plus first 5 mismatches each (baseline + got values).

## Phase 4: Package wiring

- [x] T010 `packages/native-parity/package.json`: add `@polymorph/core` + `@polymorph/adapter-web` workspace deps. Update description to reflect broader scope.
- [x] T011 `src/index.ts`: re-export new surface (`parseCssVars`, `normalizeResolved`, `idToCamelName`, `checkRuntimeParity`, `assertRuntimeParity`, `AdapterParity`).

## Phase 5: Tests (SC-001)

- [x] T012 `tests/runtime-parity.test.ts` — 14 tests: 2 normalize-resolved sanity, 2 parseCssVars round-trip (typography composite + duration / easing), 8 banks × modes × `checkRuntimeParity` + `assertRuntimeParity`, 2 tamper-detection guards (deleted CSS var + edited Dart constant).

## Phase 6: Docs

- [x] T013 `docs/guide/runtime-parity.md`: new page — what it checks, per-adapter scope table, why "runtime" not just "native", normalised value shape table, composition with pair-wise tests, what-isn't-shipped.
- [x] T014 `docs/.vitepress/config.ts`: add to sidebar.
- [x] T015 `docs/reference/packages.md`: bump `@polymorph/native-parity` row to reflect runtime-parity scope.

## Phase 7: Verification

- [x] T016 `pnpm --filter @polymorph/native-parity test` — 32 tests green (was 18; +14 new).
- [x] T017 `pnpm --filter @polymorph/docs run build` — site rebuilds, no broken links.
- [x] T018 Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **21 projects** (no new package).

## Notes

- Same package name; expanded scope. "native-parity" stays for compatibility; the
  description updates and the docs page is titled "Cross-adapter runtime parity".
- Per-adapter baseline scope avoids the Web adapter failing on component-role flat
  constants it doesn't emit. Native adapters get the full baseline.
- The two parity check families compose: pair-wise (Dart ↔ Swift ↔ Kotlin) catches per-
  language regressions cheaply; runtime parity catches "all-wrong-the-same-way". CI gates
  on both.
- Tampered-fixture tests prove the diff catches divergence (not just always-green).
