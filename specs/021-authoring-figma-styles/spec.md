# Feature Specification: Figma Text & Effect Styles Importer

**Spec ID**: 021-authoring-figma-styles

**Created**: 2026-05-28

**Status**: Implemented

**Input**: `importFigmaVariables` (Spec R) covers color / dimension / number / duration
because that's what Figma Variables actually carries. Typography composites and shadow stacks
live on a different Figma surface — **Text Styles** and **Effect Styles** — exposed through
`GET /v1/files/:key/styles` + a follow-up `nodes` query. This spec closes the gap: orgs whose
design system lives entirely in Figma can now import the **whole** Polymorph contract
(modulo `cubicBezier`, which isn't a Figma surface at all).

---

## Overview

`@polymorph/authoring` gains `importFigmaStyles(input, mapping)`, parallel to
`importFigmaVariables` and `importTokensStudio`. Inputs:

1. A `FigmaStylesInput`: `{ textStyles: Record<name, FigmaTextStyle>, effectStyles:
   Record<name, FigmaEffect[]> }`. This is a **curated**, already-flattened representation
   of Figma's Text + Effect styles. Orgs supply it from their own fetch tooling.
2. A `FigmaStylesMapping`: Polymorph semantic id → Figma style name, separately for typography
   and effects; optional `mode` (default `"light"`) for shadow placement.

Output: the same `ImportResult` shape (`{ theme, report }`) as the other importers, so a
multi-source pipeline can shallow-merge the `pm` blocks before validating.

### Scope

- **typography** (every `pm.typography.*`) — from `FigmaTextStyle`.
- **shadow** (every `pm.elevation.*`) — from `FigmaEffect[]` (`DROP_SHADOW` + `INNER_SHADOW`).

Not in scope:
- `LAYER_BLUR` / `BACKGROUND_BLUR` effects — not representable in the contract; dropped
  silently with no warning.
- `cubicBezier` — Figma doesn't expose easings via REST styles.
- Colors / dimensions / numbers — flow through `importFigmaVariables` instead.

---

## Clarifications

### Session 2026-05-28

- Q: Accept the raw Figma `GET /v1/files/:key/styles` + `nodes` response, or a curated
  flattened shape? → A: **Curated.** The raw response requires multiple round-trips and node
  introspection; flattening is an obvious utility that lives in the FI's tooling. The
  importer's contract is one well-typed JSON shape, not a Figma SDK.
- Q: Line-height — pixel or percent? → A: **Both, normalised to a multiplier.** Figma's REST
  shape carries either `lineHeightPx` or `lineHeightPercent`. The importer divides
  `lineHeightPx` by `fontSize` (yielding a multiplier) or `lineHeightPercent` by 100.
  Defaults to `1.4` (de-facto contract value) when neither is set.
- Q: Single vs. multi-effect shadow emit? → A: **Match Tokens Studio.** One effect emits a
  single shadow object; many emit an array — matching `convertToDtcg`'s shadow output shape.
- Q: Mode-routing for shadows? → A: **`mapping.mode` (default `"light"`)** — shadows are
  `modeSensitive: true` per the manifest, so they land under `pm.modes.<mode>.*`. Orgs with
  dark-mode-specific shadows run a second import with `mode: "dark"` and shallow-merge.
- Q: Compose with `importFigmaVariables`? → A: **Shallow-merge the `pm` blocks externally.**
  Each importer fills disjoint slices; the FI's pipeline merges. We don't ship a merger
  because the merge policy (deep / shallow / per-key) is org-specific.
- Q: Reuse the Variables importer's color helper? → A: **Yes — `figmaColorToHex` is
  re-exported from `figma-variables.ts`.** Both importers map Figma's `{ r, g, b, a }` 0…1
  channels through the same `#rrggbb` / `#rrggbbaa` formatter.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — An FI imports typography + shadows from Figma (Priority: P1)

The FI's tooling fetches Text Styles + Effect Styles via the REST API, flattens them into a
`FigmaStylesInput`, and calls `importFigmaStyles`. The output covers all `pm.typography.*` and
the shadow stack for one mode; the FI merges it with `importFigmaVariables` output (colors,
dimensions, opacity, duration) and validates.

**Independent Test**: `tests/figma-styles.test.ts` — end-to-end import against a hand-built
fixture; assertions on `report` (missing / unconvertible), pm.* tree shape (typography under
`pm.*`, shadows under `pm.modes.light.*`), single-vs-array shadow forms.

### User Story 2 — A dark-mode shadow pass (Priority: P1)

Same fixture, `mapping.mode: "dark"`. Output has `pm.modes.dark.elevation.*` and no
`pm.modes.light`. The FI runs both passes and merges.

**Independent Test**: covered by the `mapping.mode` test.

### User Story 3 — Reporting (Priority: P1)

Missing styles → `report.missing`; unconvertible effects (e.g. only-LAYER_BLUR stacks) →
`report.unconvertible`. Caller decides whether to fail loud or carry on.

### Edge Cases

- **Empty effect array** (`Elevation / Flat: []`) — `convertFigmaEffects` returns `null`;
  reported as `unconvertible`. (The contract requires a non-empty shadow; flat *visual*
  elevation is the absence of a token, not an empty-array token.)
- **`visible: false` effect** — ignored before conversion. A style with one
  `visible: false` and one visible drop-shadow still emits the visible one.
- **`INNER_SHADOW`** — lifts to DTCG `inset: true`. Native adapters (Flutter / Swift / Kotlin
  codegens) already document the inset-isn't-supported behaviour; the Web adapter renders
  inset via CSS `box-shadow inset`.

---

## Requirements *(mandatory)*

- **FR-001**: `importFigmaStyles(input, mapping)` MUST return the same `ImportResult` shape as
  the other importers (`{ theme, report }`).
- **FR-002**: Mapping MUST be explicit (`textStyles` / `effectStyles` records keyed by
  Polymorph semantic id). The importer MUST NOT auto-guess.
- **FR-003**: Typography MUST emit under `pm.*` directly (manifest `modeSensitive: false`).
- **FR-004**: Shadows MUST emit under `pm.modes.<mode>.*` (manifest `modeSensitive: true`),
  with `mode` defaulting to `"light"`.
- **FR-005**: `convertFigmaTextStyle` MUST handle both `lineHeightPx` (→ multiplier via
  `lineHeightPx / fontSize`) and `lineHeightPercent` (→ multiplier via `/ 100`); default to
  `1.4` when neither is supplied.
- **FR-006**: `convertFigmaEffects` MUST emit a single object for one effect and an array for
  many; MUST drop `LAYER_BLUR` / `BACKGROUND_BLUR` / `visible: false` effects.
- **FR-007**: `INNER_SHADOW` MUST lift to DTCG `inset: true`.
- **FR-008**: The importer + helpers + types MUST be exported from `@polymorph/authoring`'s
  barrel alongside the existing exports.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/figma-styles.test.ts` — 15 tests: 5 end-to-end import, 2 reporting,
  4 `convertFigmaTextStyle` (px / percent / default / null), 4 `convertFigmaEffects` (single
  vs. array / INNER_SHADOW inset / `visible: false` / unsupported types).
- **SC-002**: `tooling/authoring` total **53 tests** (was 38; +15 new).
- **SC-003**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across the existing project count (**20**) — no new package added.
- **SC-004**: Docs `guides/figma-styles` shipped; sidebar updated; FI guide enumerates four
  authoring paths; `guides/figma-variables` cross-links to the new page.

---

## Assumptions

- Orgs drive the Figma REST fetch themselves (auth, rate-limits, node introspection). The
  importer's contract is the curated `FigmaStylesInput` shape, not Figma's network.
- The two Figma importers (`importFigmaVariables` + `importFigmaStyles`) compose by
  shallow-merging the `pm` blocks; the FI owns the merge policy. We don't ship a merger
  because the right policy is org-specific.
- `cubicBezier` and `pm.opacity.*` aren't covered by Figma Styles; the former isn't a Figma
  surface, the latter belongs to Variables. Hand-author or import from Tokens Studio.
- Light-mode is the default for the shadow pass. Orgs with mode-specific shadow intensity
  run a second import; orgs whose shadows are mode-invariant in practice run one pass and
  duplicate to `dark` themselves.
