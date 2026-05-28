---

description: "Task list for Spec B — Core + Loaders"
---

# Tasks: Core + Loaders

**Input**: Design documents from `specs/002-core-loaders/`

**Tests**: First-class (conformance gating). Run with `SPECIFY_FEATURE=002-core-loaders`.

**Packages**: `@polymorph/core`, `@polymorph/loaders`, `@polymorph/cli` (all scaffolded).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 [P] `packages/core/package.json`: add deps `@polymorph/spec` (workspace), `ajv`, `ajv-formats`; devDeps `@types/node`, `vitest`; scripts `test`, `typecheck` (`tsc --noEmit -p tsconfig.typecheck.json`).
- [x] T002 [P] `packages/loaders/package.json`: add deps `@polymorph/spec`, `@polymorph/core` (workspace); devDeps `@types/node`, `vitest`; scripts `test`, `typecheck`.
- [x] T003 [P] `packages/cli/package.json`: add deps `@polymorph/spec`, `@polymorph/core`, `@polymorph/loaders`; `bin` `polymorph` → `./dist/cli.js`; devDeps `@types/node`, `vitest`; scripts `test`, `typecheck`.
- [x] T004 [P] Add `vitest.config.ts` + `tsconfig.typecheck.json` (rootDir `.`, include src+tests, `types:["node"]`) to each of core/loaders/cli.
- [x] T005 Update root `tsconfig.base.json` path mappings if needed so cross-package source imports type-resolve (`@polymorph/core`, `@polymorph/loaders`). Run `pnpm install`.

---

## Phase 2: Foundational (core internals)

- [x] T006 [P] `packages/core/src/errors.ts`: `ValidationError(Code)`, `ValidationResult`, `LintWarning`/`LintCode`, `ResolveError` per data-model.
- [x] T007 [P] `packages/core/src/contrast.ts`: pure sRGB parse (`#rgb`/`#rrggbb`/`#rrggbbaa`, `rgb()/rgba()`), WCAG 2.1 relative luminance + `contrastRatio(a,b)`; throws on unparseable.
- [x] T008 `packages/core/src/internal/walk.ts`: parse a theme into `Map<dottedPath,{ $type,$value }>`; helpers to detect alias strings `{a.b.c}`, look up targets, and resolve transitively with cycle detection.

**Checkpoint**: internals compile and `contrast.ts` unit-tests pass.

---

## Phase 3: User Story 1 — Validate with located errors (P1) 🎯 MVP

- [x] T009 [US1] `packages/core/src/validate.ts`: compile `@polymorph/spec` schemas with Ajv 2020 + ajv-formats; run schema validation (map errors → `SCHEMA_INVALID` with JSON path), then graph checks (`ALIAS_UNRESOLVED`, `ALIAS_CYCLE`) via `internal/walk`. Never throws.
- [x] T010 [P] [US1] Fixtures `packages/core/tests/fixtures/{dangling-alias,alias-cycle}.tokens.json` (schema-valid but graph-invalid).
- [x] T011 [US1] `packages/core/tests/validate.test.ts`: reuse `@polymorph/spec` valid/invalid fixtures (valid→valid, each invalid→located error); dangling-alias and cycle fixtures fail with `tokenId`/path. Depends T009, T010.

**Checkpoint**: `pnpm --filter @polymorph/core test` validates themes incl. graph rules.

---

## Phase 4: User Story 2 — Resolve to ResolvedTheme (P1) 🎯 MVP

- [x] T012 [US2] `packages/core/src/resolve.ts`: `declaredModes()` + `resolveTheme(theme, mode="light")` → `ResolvedTheme` (transitive alias resolution, mode selection, mode-invariant inclusion, component `defaultsFrom` fallback); `ResolveError` on undeclared mode. Depends T008.
- [x] T013 [US2] `packages/core/tests/resolve.test.ts`: over `light-dark` fixture — required tokens concrete (no `{}`), mode-sensitive differ per mode, mode-invariant identical, alias equals primitive value, component override vs fallback. Depends T012.

**Checkpoint**: resolution produces the neutral artifact adapters consume.

---

## Phase 5: User Story 3 — Advisory a11y lint (P2)

- [x] T014 [US3] `packages/core/src/lint.ts`: `lintTheme(resolved)` → `LintWarning[]` for `CONTRAST_TEXT_LOW`, `CONTRAST_ON_ACTION_LOW`, `TOUCH_TARGET_SMALL`, `DISABLED_OPACITY_HIGH`, `CONTRAST_SKIPPED_UNPARSEABLE`; never throws. Depends T007, T012.
- [x] T015 [P] [US3] Fixture `packages/core/tests/fixtures/low-contrast.tokens.json` (valid theme, body text barely visible on surface).
- [x] T016 [US3] `packages/core/tests/lint.test.ts`: low-contrast → located warning naming both ids + ratio; lint never changes `validateTheme` validity; unparseable color → `CONTRAST_SKIPPED_UNPARSEABLE` not failure. Depends T014, T015.
- [x] T017 [US3] `packages/core/src/index.ts`: export validate/resolve/lint/contrast APIs + error types.

**Checkpoint**: linter is loud but non-blocking (Principle VI).

---

## Phase 6: User Story 4 — Pluggable loaders (P2)

- [x] T018 [US4] `packages/loaders/src/theme-loader.ts`: `ThemeLoader`/`LoadedTheme` interfaces + a shared `makeLoadedTheme(theme)` (validate-once → handle with memoized `resolve`/`lint`/`modes`) + error classes (`ThemeValidationError`, `LoaderFetchError`, `LoaderParseError`).
- [x] T019 [P] [US4] `packages/loaders/src/inline.ts` (`InlineLoader`) and `packages/loaders/src/bundled.ts` (`BundledLoader`).
- [x] T020 [US4] `packages/loaders/src/remote-manifest.ts` (`RemoteManifestLoader`: injectable `fetch`, validate, in-memory cache + TTL, typed errors). Depends T018.
- [x] T021 [US4] `packages/loaders/src/index.ts` exports; `packages/loaders/tests/loaders.test.ts`: Inline/Remote(mock fetch)/Bundled deep-equal for a mode; remote network/parse/invalid errors typed; cache hit avoids second fetch. Depends T019, T020.

**Checkpoint**: delivery is pluggable; all three loaders agree.

---

## Phase 7: User Story 5 — CLI (P3)

- [x] T022 [US5] `packages/cli/src/cli.ts`: zero-dep `run(argv): Promise<number>` for `validate|lint|resolve <file> [--mode m] [--strict] [--json]`; reads file via `node:fs`; uses core; returns exit codes (validate 1 on invalid; lint 0, 1 with `--strict`; resolve prints JSON).
- [x] T023 [US5] `packages/cli/src/index.ts` bin wrapper (`process.exit(await run(process.argv.slice(2)))`); ensure `bin` builds to `dist/cli.js`.
- [x] T024 [US5] `packages/cli/tests/cli.test.ts`: invoke `run()` in-process over fixtures — validate exit 1/0, lint 0 vs `--strict` 1, resolve prints parseable `ResolvedTheme`. Depends T022.

**Checkpoint**: CLI wraps core for authors/CI.

---

## Phase 8: Polish

- [x] T025 [P] Update READMEs for `packages/core`, `packages/loaders`, `packages/cli`.
- [x] T026 [P] Add a `transform` stub to the CLI that prints "not yet implemented (post-v1, Style Dictionary)".
- [x] T027 Run quickstart verification: `nx run-many -t build typecheck test` green across the new packages and the whole workspace.

---

## Dependencies & Execution

- Setup → Foundational → US1 → US2 (both P1, MVP) → US3 → US4 → US5 → Polish.
- Foundational `walk.ts` (T008) blocks validate (T009) and resolve (T012); `contrast.ts` (T007)
  blocks lint (T014). `core` index (T017) blocks loaders (T018) and CLI (T022).
- Parallel: T001–T004 setup; fixtures (T010, T015) alongside their impls; loaders inline/bundled
  (T019) parallel; READMEs (T025).

## MVP

Phase 1–2 + US1 (validate) + US2 (resolve) → a theme can be validated and turned into a
`ResolvedTheme`. That is the engine the React Native adapter (Spec C) needs.

## Notes

- `core` imports no Node-only modules (RN-safe); CLI may. Keep `loaders`/`cli` third-party-dep-free
  beyond `ajv` (transitively via core).
- Reuse `@polymorph/spec` fixtures; only add fixtures core needs (graph + low-contrast).
