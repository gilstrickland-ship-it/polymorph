---

description: "Task list for Spec A — The Contract (@polymorph/spec)"
---

# Tasks: The Contract

**Input**: Design documents from `specs/001-the-contract/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included as first-class tasks. The contract's value is validation + conformance
fixtures (Constitution Principle VII), and plan.md defines the test files explicitly — so tests
are integral here, not optional.

**Scope note**: Spec A delivers data + rules in `packages/spec` — the manifest, JSON Schema, TS
types (incl. the neutral `ResolvedTheme`), conventions docs, fixtures, and schema-level tests.
The executing runtime validator/resolver (cycle + alias-resolution checks) lives in
`@polymorph/core` (Spec B); fixtures authored here for those graph rules are reused by Spec B/E.

**Run Spec Kit / test commands with** `SPECIFY_FEATURE=001-the-contract`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US6 from spec.md (Setup/Foundational/Polish carry no story label)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tooling and directory structure for `packages/spec`.

- [x] T001 Add dev tooling + scripts to `packages/spec/package.json`: devDependencies `vitest`, `ajv`, `ajv-formats`, `tsd` (or `vitest` type-testing); scripts `test` (`vitest run`), `test:watch`, `typecheck` (`tsc --noEmit -p tsconfig.json`); keep zero runtime dependencies.
- [x] T002 [P] Create the `packages/spec` skeleton dirs with `.gitkeep`: `manifest/`, `schema/`, `docs/`, `tests/fixtures/valid/`, `tests/fixtures/invalid/`, `scripts/`, `src/generated/`.
- [x] T003 [P] Add `packages/spec/vitest.config.ts` (node environment; include `tests/**/*.test.ts` and type-tests `tests/**/*.test-d.ts`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The manifest (single source of truth), generated ids, version helpers, and TS types
that every user story builds on.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

- [x] T004 Add the canonical vocabulary manifest at `packages/spec/manifest/semantic-vocabulary.v0.json` (port from `specs/001-the-contract/contracts/semantic-vocabulary.v0.json`; 68 tokens / 41 required, 7 component roles).
- [x] T005 [P] Add `packages/spec/scripts/generate-types.ts` that reads the manifest and emits `packages/spec/src/generated/contract-ids.ts` (the `SemanticTokenId` string-literal union, `ComponentRole` union, and `REQUIRED_TOKEN_IDS` const). Depends on T004.
- [x] T006 [P] Implement `packages/spec/src/version.ts`: `CONTRACT_VERSION` constant and semver compare/compatibility helpers (no diff logic yet — that is US5).
- [x] T007 Implement `packages/spec/src/types.ts`: `ThemeMode`, `ResolvedToken`, `ResolvedTheme`, `ComponentRole`, and `ThemeFile` shapes per `data-model.md` and `contracts/resolved-theme.contract.md`, importing ids from `src/generated/contract-ids.ts`. Depends on T005.
- [x] T008 Implement `packages/spec/src/vocabulary.ts`: load the manifest and expose typed accessors — `requiredTokenIds()`, `typeOf(id)`, `isSemanticTokenId(x)`, `componentRoles()`, `modeSensitiveIds()`. Depends on T004.
- [x] T009 Wire `packages/spec/src/index.ts` public API: re-export types, vocabulary accessors, version, and the resolvable paths to `schema/` and `manifest/`. Depends on T006, T007, T008.

**Checkpoint**: Manifest, generated ids, types, and accessors compile (`pnpm --filter @polymorph/spec typecheck`).

---

## Phase 3: User Story 1 — Vendor codes once against the semantic vocabulary (Priority: P1) 🎯 MVP

**Goal**: A vendor can consume the contract types and reference only `pm.*` semantic ids.

**Independent Test**: Typecheck passes; indexing `ResolvedTheme.tokens` by a `pm.*` id type-checks, and referencing a non-`pm` id is a type error.

- [x] T010 [P] [US1] Add type-level test `packages/spec/tests/types.test-d.ts`: `ResolvedTheme.tokens` indexing accepts a known `pm.*` id and rejects a primitive/unknown id; `SemanticTokenId` union is non-empty.
- [x] T011 [P] [US1] Author `packages/spec/docs/vocabulary.md` — the semantic vocabulary reference (grouped table) derived from the manifest; document that SDK code references `pm.*` only, never primitives.

**Checkpoint**: A vendor-style consumption sample compiles against `@polymorph/spec` using only semantic ids.

---

## Phase 4: User Story 2 — FI authors a conformant DTCG theme file (Priority: P1) 🎯 MVP

**Goal**: A hand-authored theme can be validated against the contract schema, with located errors.

**Independent Test**: A complete `light` theme validates; each malformed fixture fails with an error naming the offending id/path.

- [x] T012 [US2] Author `packages/spec/schema/dtcg-types.schema.json` (JSON Schema 2020-12): the accepted DTCG `$type` subset and value shapes per research R2 — `color` (string), `dimension`/`duration` as `{value,unit}` objects, `typography` constrained composite (the 5 sub-properties), `shadow`, `cubicBezier` 4-tuple, `number`, and the alias-reference string pattern `^\{[A-Za-z0-9_.-]+\}$`.
- [x] T013 [US2] Author `packages/spec/schema/theme.schema.json` (2020-12): top-level `contractVersion`, the reserved `pm` group structure, `pm.modes.light` carrying the full **required** mode-sensitive set, mode-invariant required tokens under `pm.*`, type-per-role via `$ref` to `dtcg-types.schema.json`, and rejection of unknown `pm.*` paths. Depends on T012, T004.
- [x] T014 [P] [US2] Author valid fixture `packages/spec/tests/fixtures/valid/minimal-light.tokens.json` — FI primitives + all 41 required tokens, `light` only.
- [x] T015 [P] [US2] Author invalid fixtures in `packages/spec/tests/fixtures/invalid/`: `missing-required.tokens.json`, `type-mismatch.tokens.json`, `pm-collision.tokens.json` (FI token under `pm`), `unknown-pm-id.tokens.json`.
- [x] T016 [US2] Write `packages/spec/tests/schema.test.ts` (Ajv + ajv-formats): valid fixture passes; each invalid fixture fails; assert the reported error includes the offending `instancePath`/id. Depends on T013, T014, T015.

**Checkpoint**: `pnpm --filter @polymorph/spec test` validates themes and reports located failures — the validation MVP.

---

## Phase 5: User Story 3 — FI nudges specific components without forking semantics (Priority: P2)

**Goal**: Optional component-token overrides validate against the closed v0 role set.

**Independent Test**: A no-component theme passes; a valid override passes; an unknown role fails.

- [x] T017 [P] [US3] Author `packages/spec/schema/components.schema.json`: optional `pm.<role>.<property>` overrides constrained to the closed role set (from the manifest `componentRoles`); unknown role → fail.
- [x] T018 [US3] Add an optional `$ref`/`allOf` to `components.schema.json` from `packages/spec/schema/theme.schema.json`. Depends on T013, T017.
- [x] T019 [P] [US3] Fixtures: `tests/fixtures/valid/with-components.tokens.json` and `tests/fixtures/invalid/unknown-role.tokens.json`.
- [x] T020 [US3] Write `packages/spec/tests/components.test.ts`: no-components passes; valid override passes; unknown role fails naming the role. Depends on T018, T019.

**Checkpoint**: Component layer is optional and the closed role set is enforced.

---

## Phase 6: User Story 4 — One theme file carries light, dark, high-contrast modes (Priority: P2)

**Goal**: Per-mode completeness is enforced; `dark`/`highContrast` optional but complete when present.

**Independent Test**: `light`-only passes; `light`+`dark` passes; a `dark` missing a required mode-sensitive token fails naming the missing id for that mode.

- [x] T021 [P] [US4] Fixtures: `tests/fixtures/valid/light-dark.tokens.json` (complete `light`+`dark`) and `tests/fixtures/invalid/partial-dark.tokens.json` (`dark` missing a required mode-sensitive token).
- [x] T022 [US4] Write `packages/spec/tests/modes.test.ts` against the per-mode completeness rules in `theme.schema.json` (T013): light-only and light+dark pass; partial-dark fails naming the missing mode/id. Depends on T013, T021.

**Checkpoint**: Mode completeness validates per the `pm.modes.<mode>` convention.

---

## Phase 7: User Story 6 — Existing vendor SDK adopts the contract without a rewrite (Priority: P2)

**Goal**: Guarantee the contract output is neutral enough to retrofit an existing SDK.

**Independent Test**: `ResolvedTheme` type-test confirms a plain, framework-free record; the retrofit doc references only neutral shapes.

- [x] T023 [P] [US6] Add type-level test `packages/spec/tests/resolved-theme.test-d.ts`: `ResolvedTheme` is a plain record (no React/RN/Flutter/styling-library types), keys are `pm.*` only.
- [x] T024 [P] [US6] Author `packages/spec/docs/adoption-retrofit.md`: how an existing SDK consumes `ResolvedTheme` via a thin shim into its current theme object/style API (per-platform shim is Spec C); reaffirm Principle I (no reaching around to primitives).

**Checkpoint**: Neutral output contract is type-enforced and documented for brownfield adoption.

---

## Phase 8: User Story 5 — The vocabulary evolves without breaking existing SDKs (Priority: P3)

**Goal**: Mechanize the versioning rules (additive = MINOR; new-required/rename/remove = MAJOR).

**Independent Test**: A manifest diff classifies additive changes as MINOR and breaking ones as MAJOR; a v0-valid theme stays valid under an additive bump.

- [x] T025 [US5] Implement `diffManifests(prev, next)` in `packages/spec/src/version.ts` → `{ bump, addedOptional, addedRequired, removedOrRenamed }` applying FR-016 rules. Depends on T006.
- [x] T026 [P] [US5] Write `packages/spec/tests/versioning.test.ts`: added optional token/role → MINOR (and a v0 valid fixture still validates); added required → MAJOR; rename/remove → MAJOR.
- [x] T027 [P] [US5] Author `packages/spec/docs/versioning.md`: the stability policy (additions-only safe path; breaking → major + migration note) per FR-017 / Principle III.

**Checkpoint**: Versioning is computable and documented.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T028 [P] Write `packages/spec/tests/manifest.test.ts`: consistency — every required manifest id is required in `theme.schema.json`; every manifest id has a generated `SemanticTokenId`; `componentRoles` match `components.schema.json`; all `defaultsFrom` reference real ids.
- [x] T029 [P] Update `packages/spec/README.md` to point at `schema/`, `manifest/`, and `docs/`, with a minimal usage snippet.
- [x] T030 Add an `exports` map to `packages/spec/package.json` exposing `.` (types), `./schema/*`, and `./manifest/*`; include `schema` and `manifest` in `files`. (Same file as T001 — sequential.)
- [x] T031 Run quickstart validation: `pnpm --filter @polymorph/spec build && pnpm --filter @polymorph/spec typecheck && pnpm --filter @polymorph/spec test` all green; confirm the manifest parses and counts match (68/41).

---

## Dependencies & Execution Order

### Phase order

- Setup (P1) → Foundational (P2) → User Stories (P3–P8, priority order P1→P3) → Polish (P9).
- Foundational **blocks** all user stories.

### Cross-story / same-file dependencies

- `theme.schema.json` (T013, US2) is extended by T018 (US3, component `$ref`) — sequential on that file.
- Modes (US4) rely on per-mode completeness authored in T013 (US2); US4 adds only fixtures + tests.
- `src/version.ts`: T006 (foundational constants) before T025 (US5 diff logic).

### Within each story

- Schema/fixtures before the test that asserts them; models/types before consumers.

### Parallel opportunities

- Setup: T002, T003 in parallel.
- Foundational: T005 and T006 in parallel (after T004); T008 in parallel with T005/T006.
- US2 fixtures T014, T015 in parallel; US1 T010, T011 in parallel; US6 T023, T024 in parallel; US5 T026, T027 in parallel; Polish T028, T029 in parallel.
- After Foundational, P2/P3 stories (US3, US4, US6, US5) are largely independent and can proceed in parallel, minding the `theme.schema.json` edits above.

---

## Parallel Example: User Story 2

```bash
# Author both fixture sets together:
Task: "Valid fixture packages/spec/tests/fixtures/valid/minimal-light.tokens.json"
Task: "Invalid fixtures packages/spec/tests/fixtures/invalid/*.tokens.json"
# Then the schema + test (sequential): theme.schema.json (T013) → schema.test.ts (T016)
```

---

## Implementation Strategy

### MVP (both P1 stories)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 (US1: consumable types) + Phase 4 (US2: validate a theme).
3. **STOP and VALIDATE**: a hand-authored `light` theme validates; a vendor sample compiles
   against `pm.*` ids. This is the contract MVP.

### Incremental delivery

- Add US3 (components) → US4 (modes) → US6 (retrofit neutrality) → US5 (versioning), validating
  each independently, then Polish.

---

## Notes

- The manifest is the single source of truth; schema required-assertions and generated types are
  derived from it and checked by T028 (no drift).
- Cycle detection and transitive alias resolution are **core** (Spec B) behaviors; fixtures that
  exercise them are authored here for reuse but asserted in Spec B/E.
- Commit after each phase/checkpoint; keep `@polymorph/spec` zero-runtime-dependency.
