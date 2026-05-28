---

description: "Task list for Spec G — Authoring: Tokens Studio Import"
---

# Tasks: Authoring — Tokens Studio Import

**Input**: Design documents from `specs/007-authoring-tokens-studio/`. Run with
`SPECIFY_FEATURE=007-authoring-tokens-studio`.

## Phase 1: Setup

- [x] T001 `tooling/authoring/package.json`: deps `@polymorph/spec`; devDeps `@polymorph/core` (for e2e), `@types/node`, `vitest`; scripts build/typecheck/test.
- [x] T002 Add `@polymorph/authoring` path mapping in `tsconfig.base.json`.
- [x] T003 `tsconfig.json` (build, `paths:{}`), `tsconfig.typecheck.json` (`paths:{}`, include src+tests), `vitest.config.ts`.

## Phase 2: Types + converters (US2/US3, P1)

- [x] T004 `src/types.ts`: `TokensStudioExport` / `-Set` / `-Token` / `-Theme`; `ModeMapping` and `MappingConfig`.
- [x] T005 `src/convert.ts`: `resolveValue` (alias chains, cycle detection), `parseDimension`, `normalizeFontWeight`, `normalizeLineHeight`, `normalizeOpacity`, `convertToDtcg` covering `color` / `dimension` / `typography` / `shadow` / `number` / `duration` / `cubicBezier`.

## Phase 3: Importer (US1, P1)

- [x] T006 `src/tokens-studio.ts`: `resolveSets` (merge in order; later overrides earlier), `importTokensStudio` (emits `pm.<id>` and `pm.modes.<mode>.<id>` per the mapping), `ImportReport`, and `lintMapping`.
- [x] T007 `src/index.ts` barrel.

## Phase 4: Fixture + tests

- [x] T008 `scripts/gen-tokens-studio-fixture.mjs`: read the manifest, emit a Tokens Studio export + a matching mapping covering all 68 tokens.
- [x] T009 Generate `tests/fixtures/tokens-studio.export.json` + `tests/fixtures/mapping.json`.
- [x] T010 `tests/convert.test.ts`: parseDimension / normalize* / resolveValue (incl. dangling + cycle) / convertToDtcg per type.
- [x] T011 `tests/import.test.ts`: end-to-end — `importTokensStudio(fixture)` → no `missing`/`unconvertible` → `validateTheme.valid === true` → both modes resolve distinctly → typography composite assembled correctly.

## Phase 5: CI + polish

- [x] T012 Update `.github/workflows/ci.yml` drift guard to also run `gen-tokens-studio-fixture.mjs`.
- [x] T013 Whole-workspace cold `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **11 projects**.
- [x] T014 README and `specs/007-authoring-tokens-studio/{spec,plan,research,quickstart,contracts,tasks}.md`.

## Notes

- Multi-file Tokens Studio exports: deferred (add a thin loader that consolidates to the
  single-file form and reuses this importer).
- Figma direct, auto-extract, and the interactive theme builder are separate cycles per the
  authoring roadmap.
