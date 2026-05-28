# Phase 0 Research: The Contract

Resolves the items deferred from `/speckit-clarify` plus the technology choices in Technical
Context. Format: Decision / Rationale / Alternatives.

## R1 — DTCG version to target

**Decision**: Target **DTCG "Design Tokens Format Module" 2025.10** — the community group's
**first stable version** (announced 2025-10-28). Pin this version string in the contract docs
and re-pin deliberately when DTCG publishes a new stable.

**Rationale**: 2025.10 is the first stable, production-ready DTCG release; building on a stable
version (vs. an editors' draft) directly serves Constitution Principle II. Reference
implementations exist (Style Dictionary, Tokens Studio, Terrazzo), which de-risks our later
Style-Dictionary-based build-time transform (post-v1).

**Alternatives**: Third Editors' Draft (pre-stable, moving target — rejected); inventing a
bespoke format (violates Principle II — rejected).

> Note: `designtokens.org` returns HTTP 403 to automated fetches; version confirmed via the W3C
> Design Tokens Community Group announcement (2025-10-28). Implementation should re-read the live
> spec for exact `$value` shapes before freezing the schema.

## R2 — DTCG `$type` subset Polymorph accepts

**Decision**: Accept this subset of DTCG types, mapped to semantic roles:

| DTCG `$type` | Used by semantic roles | Value shape (2025.10) |
|---|---|---|
| `color` | all `pm.color.*` | CSS Color 4 string (sRGB hex or color() incl. Display P3 / Oklch) |
| `dimension` | `pm.space.*`, `pm.radius.*`, `pm.border.width.*`, `pm.size.*` | object `{ value: number, unit: "px" | "rem" }` |
| `typography` (composite) | `pm.typography.*` | `{ fontFamily, fontWeight, fontSize, lineHeight, letterSpacing }` |
| `shadow` (composite) | `pm.elevation.*` | shadow object (or array of shadow objects) |
| `duration` | `pm.motion.duration.*` | object `{ value: number, unit: "ms" | "s" }` |
| `cubicBezier` | `pm.motion.easing.*` | `[x1, y1, x2, y2]` |
| `number` | `pm.opacity.*` | number 0..1 |
| `fontFamily`, `fontWeight` | (sub-properties of `typography`) | string / number-or-keyword |

**Rationale**: Covers every Appendix A role with native DTCG types — no custom `$type` needed
(Principle II). Note the **2025.10 dimension/duration are objects** (`{value, unit}`), not bare
strings; the schema and TS types must reflect that.

**Alternatives**: Custom `$type`s for elevation/motion (rejected — DTCG already covers them);
bare-string dimensions (rejected — not valid in the stable spec).

## R3 — Typography composite richness

**Decision**: **Constrained subset** (clarify decision): exactly `fontFamily`, `fontWeight`,
`fontSize`, `lineHeight`, `letterSpacing`; each required for a valid composite.

**Rationale**: These five map cleanly to React Native `TextStyle`, Flutter `TextStyle`, SwiftUI,
and CSS. Omitting fancier DTCG typography fields keeps every adapter's interpretation trivial and
avoids cross-platform gaps. A partially-specified composite fails validation (spec Edge Cases).

**Alternatives**: Full DTCG typography composite (more fields don't map cross-platform — rejected
for v0; can be added additively later).

## R4 — Theme modes encoding

**Decision**: **Parallel per-mode token sets** (clarify decision). DTCG 2025.10 does **not**
standardize modes/themes, so we define a convention: a theme file contains shared primitives plus
a `pm` group whose mode-sensitive semantic tokens are organized per mode. Concretely, the
contract reserves a top-level **`$modes`-free** structure where each declared mode (`light`,
`dark`, `highContrast`) provides the complete required semantic set; mode-invariant tokens
(spacing, radii, motion, sizing) need not be duplicated.

**Rationale**: No dependency on an unstandardized DTCG modes feature; per-mode completeness
(FR-006/FR-012) is trivially validated by checking each mode's set against the manifest's
required list; the resolver's job (Spec B) reduces to "pick mode → flatten."

**Open implementation detail (for `/speckit-tasks`)**: exact JSON placement of per-mode sets —
two clean options to choose at implementation: (a) `pm.color` etc. carry per-mode values via a
`$extensions.pm.modes` block on each mode-sensitive token, or (b) sibling groups
`pm.modes.light.color.*`, `pm.modes.dark.color.*`. Option (b) keeps tokens single-valued and
DTCG-vanilla (recommended); the schema will encode whichever is chosen. Mode-invariant tokens
live under `pm.*` directly.

**Alternatives**: `$extensions` mode-keyed single tokens (compact but harder to validate/port);
DTCG `$modes` (not stable — rejected).

## R5 — Reserved namespace

**Decision**: Reserve top-level **`pm`** group for all contract IDs (`pm.color.*`,
`pm.typography.*`, `pm.button.primary.*`, `pm.modes.*`). Validator rejects any FI token under
`pm` that is not a recognized contract ID; FI primitives live in any non-`pm` group and are
referenced by `pm` semantic aliases via DTCG `{group.token}` curly-brace references.

**Rationale**: Zero collision risk with FI token names; unambiguous separation of "contract" vs
"FI" tokens; makes the typo warning (Edge Cases) precise (unknown `pm.*` ID → warn).

**Alternatives**: Bare paths + heuristics (collision/typo risk — rejected). Longer prefix
`polymorph` (more verbose, no added safety — rejected).

## R6 — Validation tooling & schema dialect

**Decision**: Express the theme schema in **JSON Schema 2020-12**. The schema is shipped as data
by `@polymorph/spec`; the executing validator is **Ajv 8** living in `@polymorph/core` (Spec B).
Rules beyond JSON Schema's expressiveness — alias resolvability, **cycle detection**, per-mode
completeness, `pm` collision — are specified here as required checks and implemented as
programmatic validators in core.

**Rationale**: JSON Schema 2020-12 is widely supported and language-neutral (Principle IV); Ajv
is the de-facto fast validator. Keeping the engine out of `@polymorph/spec` preserves its
zero-dependency goal. Graph rules can't be expressed in JSON Schema, so they're contract-defined
behaviors (FR-013/014/015) implemented in core.

**Alternatives**: Zod-only (TS-coupled, not language-neutral — rejected as the canonical schema);
JSON Schema draft-07 (older; 2020-12 has better `$ref`/`unevaluatedProperties` — rejected).

## R7 — Vocabulary manifest as the single source of truth

**Decision**: Treat `manifest/semantic-vocabulary.v0.json` as the **canonical** definition (each
entry: `id`, `$type`, `required`, `modeSensitive`, `group`, `description`, optional `defaultsFrom`
for component roles). Generate/verify both the JSON Schema's required-token assertions and the TS
ID/`ResolvedTheme` types from the manifest; a test asserts the three stay consistent.

**Rationale**: One edit point for the vocabulary; eliminates schema/types/docs drift; directly
supports versioning (diffing manifests computes MAJOR vs MINOR per FR-016).

**Alternatives**: Hand-maintain schema + types + docs separately (drift-prone — rejected).

## R8 — Versioning mechanics

**Decision**: The manifest carries `contractVersion` (semver). A build-time check **diffs** the
current manifest against the previous published manifest: added optional token/role → MINOR;
added required token, or any rename/removal → MAJOR. CI surfaces the computed bump; humans set the
version.

**Rationale**: Mechanizes Principle III / FR-016-017 so breaking changes can't slip through
unlabeled.

**Alternatives**: Manual version discipline only (error-prone — rejected).

## Resolved unknowns

All NEEDS CLARIFICATION items are resolved: DTCG version (R1, 2025.10 stable), type set (R2),
typography (R3), modes (R4), namespace (R5), validation dialect/engine split (R6). One
implementation-level detail (exact per-mode JSON placement, R4) is intentionally left for
`/speckit-tasks` with a recommended option.

## Sources

- [Design Tokens specification reaches first stable version (W3C DTCG, 2025-10-28)](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- [Design Tokens Format Module 2025.10 (drafts index)](https://www.designtokens.org/tr/drafts/)
- [Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [What's new in the Design Tokens spec — zeroheight](https://zeroheight.com/blog/whats-new-in-the-design-tokens-spec/)
