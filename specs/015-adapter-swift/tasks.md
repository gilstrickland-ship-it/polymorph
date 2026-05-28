---

description: "Task list for Spec O — Swift adapter (SwiftUI codegen)"
---

# Tasks: Swift Adapter — SwiftUI Codegen

**Input**: Design documents from `specs/015-adapter-swift/`.

## Phase 1: Setup

- [x] T001 `packages/adapter-swift/package.json`: deps `@polymorph/spec`, `@polymorph/core`; devDeps `@types/node`, `tsx`, `vitest`; scripts `build`, `typecheck`, `test`, `update-goldens`.
- [x] T002 Add `@polymorph/adapter-swift` path mapping in `tsconfig.base.json`.
- [x] T003 `tsconfig.json` (build, `paths:{}`), `tsconfig.typecheck.json` (`noEmit`, base path mappings, include src+tests+scripts), `vitest.config.ts` (node env, `tests/**/*.test.ts`).

## Phase 2: Converters (US1, P1)

- [x] T004 `src/swift.ts`: `idToSwiftName` + `componentPropSwiftName`; `colorToSwift` (via `parseColor`, alpha forced 1.0, channels 0…1 with 4-decimal stable formatting); `dimToSwift` (px assumed, rem ×16); `durationToSwift` (TimeInterval seconds — ms÷1000); `numberToSwift`; `cubicBezierToSwift` ((Double,Double,Double,Double) tuple); `typographyToSwift` (PolymorphTextStyle + `Font.Weight` nearest-of-100..900); `shadowToSwift` ([PolymorphShadow]; inset commented as unsupported).

## Phase 3: Codegen + barrel (US1)

- [x] T005 `src/codegen.ts`: `transformToSwift(theme, options)` validates + resolves via `@polymorph/core`, walks the manifest in order, groups output into Colors / Dimensions / Numbers / Motion / Typography / Shadows / Component tokens sections under `// MARK: -` banners, inlines `PolymorphTextStyle` + `PolymorphShadow` helper structs at the top.
- [x] T006 `src/index.ts` barrel re-exporting all converters + `transformToSwift` + `emitSwiftFromResolved`.

## Phase 4: Goldens + tests

- [x] T007 `scripts/update-goldens.ts`: generates the four `tests/golden/{aurora,borealis}_{light,dark}.swift` files from the mock-bank theme JSONs.
- [x] T008 `tests/codegen.test.ts`: four golden byte-equal matches (US1 acceptance) + two name-conversion + seven per-type converter tests.

## Phase 5: CLI integration (US3)

- [x] T009 `packages/cli/package.json`: add `@polymorph/adapter-swift` dependency; update description.
- [x] T010 `packages/cli/src/run.ts`: extend the existing `transform` command — `--target` now accepts `swift` in addition to `dart`; the `--class` flag re-maps to `enumName` for the Swift adapter. Usage string updated.
- [x] T011 `packages/cli/tests/cli.test.ts`: one new `--target swift` case alongside the existing three `transform` cases.

## Phase 6: Drift guard + polish

- [x] T012 `.github/workflows/ci.yml`: extend the "Verify generated artifacts are in sync" step to build both adapter packages and run their `update-goldens` scripts.
- [x] T013 `packages/adapter-swift/README.md` (type-mapping table, applying `PolymorphTextStyle`, CLI usage, goldens section) and `specs/015-adapter-swift/{spec,tasks}.md`.
- [x] T014 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **17 projects**.

## Notes

- The emitted file is self-contained — helper structs are inlined so the consumer's iOS app has
  no Polymorph runtime dependency. Drop the file into Xcode, import, use.
- Output is deterministic: manifest iteration order, channels formatted to 4 decimals (trailing
  zeros stripped), no timestamps — required for byte-equal goldens.
- Alpha is forced to `1.0` in v1; revisit when a token actually needs translucency.
- `inset` shadows are dropped with a comment — SwiftUI's `.shadow` modifier has no inset mode.
- The `--class` CLI flag re-maps to `enumName` for this target since Swift enums act as the
  namespace; users coming from `--target dart` see the same flag.
- Kotlin (Android) adapter can follow the same shape — a third `--target kotlin` value emitting
  Jetpack Compose `Color` / `Dp` / `TextStyle` via the same converter pattern.
