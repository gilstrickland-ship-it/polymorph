---

description: "Task list for Spec AA — project-local policy packs"
---

# Tasks: Project-Local Policy Packs

**Input**: Design documents from `specs/027-policy-packs/`.

## Phase 1: Types (FR-003)

- [x] T001 `packages/core/src/errors.ts`: add `CustomLintCode` (branded string alias) and widen `LintWarning.code` to `LintCode | CustomLintCode`.

## Phase 2: Surface (FR-001 / FR-002 / FR-004 / FR-005 / FR-006 / FR-007)

- [x] T002 `packages/core/src/policy-packs.ts`: `PolicyPack` + `PolicyRule` types.
- [x] T003 `definePolicyPack(pack)` identity-typed helper for type-safe pack declarations.
- [x] T004 `lintWithPolicies(rt, packs)` — runs `lintTheme(rt)`, then iterates packs in array order, runs each rule, catches throws (emitting `POLICY_RULE_ERROR` carrying pack name + version + error message), and concatenates output.
- [x] T005 `filterWarnings(warnings, predicate)` CI-gating helper.
- [x] T006 `warning(code, message, tokenIds?, measured?, threshold?)` terse constructor.

## Phase 3: Barrel exports

- [x] T007 `packages/core/src/index.ts`: re-export `definePolicyPack`, `lintWithPolicies`, `filterWarnings`, `warning`, `PolicyPack`, `PolicyRule`, `CustomLintCode`.

## Phase 4: Tests (SC-001)

- [x] T008 `packages/core/tests/policy-packs.test.ts` — 9 tests covering: definePolicyPack identity, no-packs ≡ lintTheme, append-in-order, multi-pack-order, throwing-rule → error warning + subsequent rule, filterWarnings, realistic pack (locale large-text floor) fires on Aurora, tokenIds carries offending id, built-in codes unchanged.

## Phase 5: Docs

- [x] T009 `docs/guide/policy-packs.md`: new page — what a pack is, rule shape table, what rules can / can't do, CI gating pattern, composition with @polymorph/builder, what isn't shipped.
- [x] T010 `docs/.vitepress/config.ts`: add to Guide sidebar.

## Phase 6: Verification

- [x] T011 `pnpm --filter @polymorph/core test` — 61 tests green (was 52; +9 new).
- [x] T012 `pnpm --filter @polymorph/docs run build` — site rebuilds, no broken links (after fixing the constitution-path dead link).
- [x] T013 Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **21 projects** (no new package).

## Notes

- Extending `@polymorph/core` (not a new package) keeps the lint composition story tight.
- Sync-only by design. Async would force every CLI / builder / editor consumer to
  refactor; FI rules that need external data inject it at construction.
- Throwing rules emit `POLICY_RULE_ERROR` carrying pack name + version. The pipeline
  never aborts mid-stream — one bad rule doesn't blind the rest of the audit.
- Packs add; they don't subtract. Removing built-in rules via a pack would bypass the
  contract; FIs that need filtering wrap `lintWithPolicies` in their tooling.
- No registry / discovery mechanism. Packs are plain TS objects; distribution is the FI's
  existing problem.
