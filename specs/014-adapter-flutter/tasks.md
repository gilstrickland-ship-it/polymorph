---

description: "Task list for Spec N — Flutter adapter (Dart codegen)"
---

# Tasks: Flutter Adapter — Dart Codegen

**Input**: Design documents from `specs/014-adapter-flutter/`.

## Phase 1: Setup

- [x] T001 `packages/adapter-flutter/package.json`: deps `@polymorph/spec`, `@polymorph/core`; devDeps `@types/node`, `tsx`, `vitest`; scripts `build`, `typecheck`, `test`, `update-goldens`.
- [x] T002 Add `@polymorph/adapter-flutter` path mapping in `tsconfig.base.json`.
- [x] T003 `tsconfig.json` (build, `paths:{}`), `tsconfig.typecheck.json` (`noEmit`, base path mappings, include src+tests+scripts), `vitest.config.ts` (node env, `tests/**/*.test.ts`).

## Phase 2: Converters (US1, P1)

- [x] T004 `src/dart.ts`: `idToDartName` + `componentPropDartName`; `colorToDart` (via `parseColor`, alpha forced FF); `dimToDart` (px assumed, rem ×16); `durationToDart` (ms/s); `numberToDart`; `cubicBezierToDart`; `typographyToDart` (TextStyle + `FontWeight.w<N>` nearest-of-100..900); `shadowToDart` (`<BoxShadow>[…]`; inset commented as unsupported).

## Phase 3: Codegen + barrel (US1)

- [x] T005 `src/codegen.ts`: `transformToDart(theme, options)` validates + resolves via `@polymorph/core`, walks the manifest in order, groups output into Colors / Dimensions / Numbers / Motion / Typography / Shadows / Component tokens sections, emits opinionated `buildThemeData()` factory mapping standard semantic tokens onto `ColorScheme` / `TextTheme` / `ThemeData`.
- [x] T006 `src/index.ts` barrel re-exporting all converters + `transformToDart` + `emitDartFromResolved`.

## Phase 4: Goldens + tests

- [x] T007 `scripts/update-goldens.ts`: generates the four `tests/golden/{aurora,borealis}_{light,dark}.dart` files from the mock-bank theme JSONs.
- [x] T008 `tests/codegen.test.ts`: four golden byte-equal matches (US1 acceptance) + two name-conversion + seven per-type converter tests.

## Phase 5: CLI integration (US3)

- [x] T009 `packages/cli/package.json`: add `@polymorph/adapter-flutter` dependency; update description.
- [x] T010 `packages/cli/src/run.ts`: implement `transform <file> --target dart [--mode] [--class] [--output]` (validate first, exit 1 on invalid; exit 2 on missing/unknown target; stdout or `--output` write).
- [x] T011 `packages/cli/tests/cli.test.ts`: three new `transform` cases (Dart output, required `--target`, invalid-theme rejection).

## Phase 6: Drift guard + polish

- [x] T012 `.github/workflows/ci.yml`: extend the "Verify generated artifacts are in sync" step to also run `pnpm --filter @polymorph/adapter-flutter run update-goldens`.
- [x] T013 `packages/adapter-flutter/README.md` (type-mapping table, CLI usage, goldens section) and `specs/014-adapter-flutter/{spec,tasks}.md`.
- [x] T014 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **16 projects**.

## Notes

- The adapter is codegen-only: no in-app DTCG runtime, no Dart toolchain required to produce
  output. The consumer's Flutter build is what compiles the emitted `.dart` file.
- Output is deterministic: manifest iteration order, fixed number formatting, no timestamps —
  required for the byte-equal golden test and the CI drift guard.
- Alpha is forced to `FF` in v1; revisit when a token actually needs translucency.
- `inset` shadows fall out: Flutter's `BoxShadow` has no inset; the emitter drops them with a
  `// inset: unsupported` comment in the list literal.
- iOS / Android native adapters (Swift / Kotlin codegen) can follow the same shape — a new
  package + a new `--target` value on the CLI.
