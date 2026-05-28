---

description: "Task list for Spec R — Figma Variables importer"
---

# Tasks: Figma Variables Importer

**Input**: Design documents from `specs/018-authoring-figma-variables/`.

## Phase 1: Importer + types (US1, P1)

- [x] T001 `tooling/authoring/src/figma-variables.ts`: types for the Figma REST API Variables response (`FigmaVariablesResponse`, `FigmaVariable`, `FigmaVariableCollection`, `FigmaVariableValue`, `FigmaVariableAlias`, `FigmaVariableColorValue`, `FigmaVariableResolvedType`).
- [x] T002 `figma-variables.ts`: `FigmaMapping` interface (Polymorph id → Figma variable name; Polymorph mode → Figma mode name; optional `collection` filter).
- [x] T003 `figma-variables.ts`: pure helpers — `figmaColorToHex({r,g,b,a})` (`#rrggbb` / `#rrggbbaa`), `resolveAlias(value, modeId, vars, visiting)` (eager chain resolution; throws on cycle / dangling).
- [x] T004 `figma-variables.ts`: `convertFigmaValue(value, targetType)` — `color` / `dimension` / `number` / `duration`; explicit `null` for `typography` / `shadow` / `cubicBezier`.
- [x] T005 `figma-variables.ts`: `importFigmaVariables(response, mapping)` — pick the active collection, look up modes by name, walk `mapping.ids` and route mode-sensitive vs. invariant per `manifest.modeSensitive`, return the same `ImportResult` shape as the Tokens Studio importer.

## Phase 2: Barrel + types export

- [x] T006 `tooling/authoring/src/index.ts`: re-export the importer, helpers, and every Figma type so consumers don't dig into `figma-variables.js`.

## Phase 3: Fixture + tests

- [x] T007 `tooling/authoring/tests/fixtures/figma-variables.export.json`: hand-built representative export with one collection, two modes, three direct COLOR variables, one COLOR alias-chain, three FLOAT variables for dimension / number / duration, plus a primitive variable used as the alias target.
- [x] T008 `tooling/authoring/tests/figma-variables.test.ts`: 15 tests covering end-to-end import (no missing / no unconvertible / correct mode routing / alias resolution / hex formatting), reporting (missing + unconvertible), per-type conversion, and alias edges (cycle + dangling).

## Phase 4: Docs

- [x] T009 `docs/guides/figma-variables.md`: usage walkthrough, type mapping table, aliases, modes, scope (color / dimension / number / duration only), Tokens-Studio-vs-Figma decision table.
- [x] T010 `docs/.vitepress/config.ts`: add the new page to the Adoption sidebar.
- [x] T011 `docs/guides/fi.md`: surface the second authoring path in the three-paths table.

## Phase 5: Verification

- [x] T012 `pnpm --filter @polymorph/authoring run test` — 38 tests green (was 23; +15 new).
- [x] T013 `pnpm --filter @polymorph/docs run build` — site rebuilds with the new page; no broken-link warnings.
- [x] T014 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **19 projects** (no new projects added — the importer ships inside the existing `@polymorph/authoring`).

## Notes

- The Figma REST API is the source-of-truth shape — we don't depend on any Figma SDK or plugin
  bindings. Consumers drive the fetch (token, file key, rate-limits) and pass the response.
- Eager alias resolution matches the Tokens Studio importer; both produce themes with no
  aliases left for `resolveTheme` to chase. Future option: `--preserve-aliases` if there's
  demand.
- Typography / shadow / cubicBezier are intentionally not covered — Figma stores those as Text
  Styles / Effect Styles via a different REST endpoint. A future spec can layer those on.
- The hand-built fixture has 7 mapped tokens (4 invariant + 3 mode-sensitive across 2 modes →
  10 import events; 7 unique ids). The Tokens Studio fixture by comparison hits the full 68;
  this importer's scope is narrower by Figma-API design.
- No CI drift guard added: the fixture is hand-authored (not generated). Editing it manually
  is expected.
