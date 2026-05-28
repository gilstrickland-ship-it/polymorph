---

description: "Task list for Spec U — Figma Text & Effect Styles importer"
---

# Tasks: Figma Text & Effect Styles Importer

**Input**: Design documents from `specs/021-authoring-figma-styles/`.

## Phase 1: Importer + types (US1, P1)

- [x] T001 `tooling/authoring/src/figma-styles.ts`: input shape types (`FigmaTextStyle`, `FigmaEffect`, `FigmaStylesInput`) and `FigmaStylesMapping` (Polymorph id → Figma style name, separately for `textStyles` and `effectStyles`; optional `mode` for shadow placement).
- [x] T002 `figma-styles.ts`: `convertFigmaTextStyle(style)` — DTCG typography token; `lineHeightPx` → multiplier (`/ fontSize`), `lineHeightPercent` → multiplier (`/ 100`), default `1.4`; `letterSpacing` defaults to `0`.
- [x] T003 `figma-styles.ts`: `convertFigmaEffects(effects)` — DTCG shadow token; filters to `DROP_SHADOW` / `INNER_SHADOW` with `visible !== false`; lifts INNER_SHADOW to `inset: true`; single vs. array shape match `convertToDtcg`.
- [x] T004 `figma-styles.ts`: `importFigmaStyles(input, mapping)` — typography under `pm.*` (mode-invariant), shadow under `pm.modes.<mode>.*` (mode-sensitive, default `light`). Same `ImportResult` shape as the other importers.
- [x] T005 Re-use `figmaColorToHex` from `figma-variables.ts` for the shadow color → hex conversion (consistent `#rrggbb` / `#rrggbbaa`).

## Phase 2: Barrel + types export

- [x] T006 `tooling/authoring/src/index.ts`: re-export `importFigmaStyles`, `convertFigmaTextStyle`, `convertFigmaEffects`, and every type from `figma-styles.ts` alongside the existing exports.

## Phase 3: Fixture + tests

- [x] T007 `tooling/authoring/tests/fixtures/figma-styles.export.json`: hand-built representative input — 7 text styles (display / heading / body / bodyStrong / label / caption / mono) covering both line-height shapes (`lineHeightPx` + `lineHeightPercent`), 5 effect styles (flat / raised-multi-layer / overlay / inset / background-blur).
- [x] T008 `tooling/authoring/tests/figma-styles.test.ts`: 15 tests — 5 end-to-end (import, typography placement, shadow placement, mode override, multi-effect stack); 2 reporting (missing style, unsupported-only effect stack); 4 `convertFigmaTextStyle` (px-line-height, percent-line-height, default-line-height, missing-required); 4 `convertFigmaEffects` (single vs. array, INNER_SHADOW inset lift, `visible: false` filter, unsupported types).

## Phase 4: Docs

- [x] T009 `docs/guides/figma-styles.md`: usage walkthrough, type-mapping tables (text + effect), composing with the Variables importer (merge pattern), Tokens-Studio-vs-Figma-Styles decision table.
- [x] T010 `docs/.vitepress/config.ts`: add the page to the Adoption sidebar.
- [x] T011 `docs/guides/figma-variables.md`: cross-link to the new Styles importer where it discusses typography / shadow as out-of-scope.
- [x] T012 `docs/guides/fi.md`: surface the fourth authoring path in the table.

## Phase 5: Verification

- [x] T013 `pnpm --filter @polymorph/authoring run test` — 53 tests green (was 38; +15 new).
- [x] T014 `pnpm --filter @polymorph/docs run build` — site rebuilds with the new page; no broken-link warnings.
- [x] T015 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **20 projects** (no new package added — the importer ships inside `@polymorph/authoring`).

## Notes

- Curated input shape (not raw Figma REST). The flatten — `/v1/files/:key/styles` +
  `/v1/files/:key/nodes` — lives in the FI's tooling because every org's auth + rate-limit
  posture differs. The docs page describes the recommended fetch pattern; we don't ship a
  fetcher.
- `LAYER_BLUR` / `BACKGROUND_BLUR` aren't representable in the contract; dropped silently
  with no warning. (No spec change needed — blurs are a visual effect, not a token type.)
- INNER_SHADOW lifts to DTCG `inset: true`. The Web adapter renders it; native codegens
  already document inset-isn't-supported behaviour (Flutter `BoxShadow` / Swift `.shadow` /
  Compose `.shadow` all lack inset).
- Compose with `importFigmaVariables` via shallow-merge of the `pm` blocks. We don't ship a
  merger — the merge policy (deep / shallow / per-key) is org-specific. The docs page shows
  the simplest spread-based merge.
- Mode-routing for shadows is one-pass-per-mode. Orgs with mode-specific shadow intensity run
  twice and merge.
