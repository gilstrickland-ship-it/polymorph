---

description: "Task list for Spec P — Kotlin adapter (Jetpack Compose codegen)"
---

# Tasks: Kotlin Adapter — Jetpack Compose Codegen

**Input**: Design documents from `specs/016-adapter-kotlin/`.

## Phase 1: Setup

- [x] T001 `packages/adapter-kotlin/package.json`: deps `@polymorph/spec`, `@polymorph/core`; devDeps `@types/node`, `tsx`, `vitest`; scripts `build`, `typecheck`, `test`, `update-goldens`.
- [x] T002 Add `@polymorph/adapter-kotlin` path mapping in `tsconfig.base.json`.
- [x] T003 `tsconfig.json` (build, `paths:{}`), `tsconfig.typecheck.json` (`noEmit`, base path mappings, include src+tests+scripts), `vitest.config.ts` (node env, `tests/**/*.test.ts`).

## Phase 2: Converters (US1, P1)

- [x] T004 `src/kotlin.ts`: `idToKotlinName` + `componentPropKotlinName`; `colorToKotlin` (via `parseColor`, alpha forced FF, `Color(0xFFRRGGBB)`); `dimToKotlin` (Compose `Dp` via `.dp`; px assumed; rem ×16); `dimToKotlinSp` (`TextUnit` via `.sp` — used inside typography composites); `durationToKotlin` (Int milliseconds; s ×1000); `numberToKotlin` (Float with `f` suffix); `cubicBezierToKotlin` (`CubicBezierEasing(...)`); `typographyToKotlin` (`PolymorphTextStyle(...)` + `FontWeight.W<N>` nearest-of-100..900); `shadowToKotlin` (`listOf(PolymorphShadow(...), ...)`; inset commented as unsupported).

## Phase 3: Codegen + barrel (US1)

- [x] T005 `src/codegen.ts`: `transformToKotlin(theme, options)` validates + resolves via `@polymorph/core`, walks the manifest in order, groups output into Colors / Dimensions / Numbers / Motion / Typography / Shadows / Component tokens sections under `// region … // endregion` banners, inlines `PolymorphTextStyle` + `PolymorphShadow` helper data classes at the top, configurable `packageName` (default `polymorph.theme`).
- [x] T006 `src/index.ts` barrel re-exporting all converters + `transformToKotlin` + `emitKotlinFromResolved`.

## Phase 4: Goldens + tests

- [x] T007 `scripts/update-goldens.ts`: generates the four `tests/golden/{aurora,borealis}_{light,dark}.kt` files from the mock-bank theme JSONs.
- [x] T008 `tests/codegen.test.ts`: four golden byte-equal matches (US1 acceptance) + two name-conversion + seven per-type converter tests.

## Phase 5: CLI integration (US3)

- [x] T009 `packages/cli/package.json`: add `@polymorph/adapter-kotlin` dependency; update description.
- [x] T010 `packages/cli/src/run.ts`: extend the existing `transform` command — `--target` now accepts `kotlin` in addition to `dart` and `swift`; the `--class` flag re-maps to `objectName` for the Kotlin adapter. Usage string updated.
- [x] T011 `packages/cli/tests/cli.test.ts`: one new `--target kotlin` case alongside the existing dart/swift cases.

## Phase 6: Drift guard + polish

- [x] T012 `.github/workflows/ci.yml`: extend the "Verify generated artifacts are in sync" step to build all three adapter packages and run all three `update-goldens` scripts.
- [x] T013 `packages/adapter-kotlin/README.md` (type-mapping table, applying `PolymorphTextStyle`, CLI usage, goldens section) and `specs/016-adapter-kotlin/{spec,tasks}.md`.
- [x] T014 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **18 projects**.

## Notes

- The emitted file is self-contained — helper data classes are inlined so the consumer's
  Android app has no Polymorph runtime dependency. Drop the file into the right source set
  and `import`.
- Output is deterministic: manifest iteration order, fixed `f`-suffixed Float literals, hex
  colors uppercase, no timestamps — required for byte-equal goldens.
- Alpha is forced to `FF` in v1; revisit when a token actually needs translucency.
- `inset` shadows are dropped with a comment — Compose's `.shadow` modifier has no inset mode.
- `fontFamily` comes through as a plain `String` because Compose's `FontFamily` needs the
  consumer's `Font` resources; a small `@Composable` extension bridges (sample in README).
- Completes the native triad: Flutter (Dart) + Swift + Kotlin all share the same converter
  pattern, just different target-language formatting.
