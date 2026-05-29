# Feature Specification: Project-Local Policy Packs

**Spec ID**: 027-policy-packs

**Created**: 2026-05-29

**Status**: Implemented

**Input**: The built-in lint covers what every Polymorph adopter benefits from — WCAG 2.1
contrast, motion-reduce, protected surfaces, touch / opacity / motion floors. FIs invariably
have additional policies (brand-guard, locale-specific text floors, internal compliance
adds). Forking `@polymorph/core` to add them is the wrong shape. Policy packs are the right
one.

---

## Overview

`@polymorph/core` gains a small policy-pack surface:

| Surface | Purpose |
|---|---|
| `PolicyPack`, `PolicyRule` | Plain-object pack shape: `{name, version, rules, description?}`. |
| `definePolicyPack(pack)` | Identity-typed helper for compile-time pack validation. |
| `lintWithPolicies(rt, packs)` | Run built-in lint + every pack's rules. Rules that throw surface as synthetic `POLICY_RULE_ERROR` warnings. |
| `filterWarnings(warnings, predicate)` | CI gating helper — isolate the subset a CI gate cares about. |
| `warning(code, message, tokenIds?, measured?, threshold?)` | Terse constructor for rule call-sites. |
| `CustomLintCode` type | Nominal alias documenting that pack codes are open strings while built-in codes form a closed union. |

The `LintWarning.code` field widens to `LintCode | CustomLintCode` (string subtype) so any
FI-namespaced code passes structurally while built-in codes still narrow for autocomplete.

---

## Clarifications

### Session 2026-05-29

- Q: New package or extend `@polymorph/core`? → A: **Extend core.** The policy pack
  surface is a tiny addition; isolating it would create an awkward dependency dance and
  fragment the lint composition story.
- Q: Pack rules synchronous or async? → A: **Synchronous.** Lint is sync today; making it
  async would break every CLI / builder consumer. If a pack needs external data, the FI
  injects it at construction (closure over pre-fetched data).
- Q: How are pack-thrown errors handled? → A: **Caught and converted to `POLICY_RULE_ERROR`
  warnings.** Carries pack name + version + error message. The lint pipeline never aborts.
- Q: Code-space namespacing enforced? → A: **No.** The convention is FI-prefix
  (`ACME_*` / `BANK_*`), but the runtime accepts any string. Built-in `LintCode` stays a
  closed union for TS narrowing on built-in checks.
- Q: Can packs remove built-in rules? → A: **No.** Packs add. Built-in rules are the
  contract's promise; subtracting them via a pack would bypass the contract. FIs that need
  filtering wrap `lintWithPolicies` in their own tooling.
- Q: Pack discovery / registry? → A: **Out of scope.** Packs are plain TS objects; FIs
  distribute them via internal registry / monorepo / shared package — whatever they already
  do.
- Q: Auto-fix? → A: **Out of scope.** Packs identify; they don't mutate. Same as the
  built-in lint.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — FI adds a brand-guard rule (Priority: P1)

The FI's design-system team writes a pack with a `ACME_PRIMARY_DRIFT` rule that fires when
`pm.color.action.primary.rest` doesn't match the official brand hex. CI runs
`lintWithPolicies(rt, [brandGuard])` and the FI's gate script escalates `ACME_*` warnings
into build failures.

**Independent Test**: `tests/policy-packs.test.ts` — a realistic pack (locale large-text
floor) is composed in, fires on Aurora, carries the offending token in `tokenIds`.

### User Story 2 — Pack rule throws unexpectedly (Priority: P1)

A pack rule has a latent bug and throws on a specific theme shape. The lint pipeline emits
a `POLICY_RULE_ERROR` carrying the pack name + version + error message and continues
running subsequent rules.

**Independent Test**: `tests/policy-packs.test.ts` — throwing rule + subsequent rule;
assert both error warning + post-error rule output appear.

### User Story 3 — CI gating split (Priority: P2)

CI script uses `filterWarnings` to escalate the subset matching a predicate (typically
`code.startsWith("PROTECTED_") || code === "ACME_CRITICAL"`) into a build failure; the
rest stay advisory in the build log.

**Independent Test**: `filterWarnings` test isolates the predicate subset cleanly.

### Edge Cases

- **No packs supplied** → `lintWithPolicies(rt)` == `lintTheme(rt)` exactly.
- **Multiple packs** → fire in pack-array order, then rule-array order within each.
- **Throwing rule mid-pack** → swallow + emit `POLICY_RULE_ERROR`; subsequent rules in the
  same pack still run.

---

## Requirements *(mandatory)*

- **FR-001**: `lintWithPolicies(rt, packs)` MUST return the built-in `lintTheme` output
  followed by every pack's warnings in pack-array order.
- **FR-002**: A rule that throws MUST NOT abort the pipeline; the runtime MUST emit a
  synthetic `POLICY_RULE_ERROR` carrying the pack name + version + error message.
- **FR-003**: `LintWarning.code` MUST accept any string while preserving narrowing on the
  built-in `LintCode` union.
- **FR-004**: `definePolicyPack` MUST be an identity-typed helper (no runtime
  transformation), so packs participate in TypeScript narrowing at the declaration site.
- **FR-005**: `filterWarnings(warnings, predicate)` MUST return only warnings whose code
  passes the predicate.
- **FR-006**: `warning(code, message, tokenIds?, measured?, threshold?)` MUST produce a
  `LintWarning` with sensible defaults (`tokenIds: []`, `measured: 0`, `threshold: 0`).
- **FR-007**: The policy-pack surface MUST stay synchronous (no async rules) to match the
  existing lint pipeline.

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/policy-packs.test.ts` — 9 tests: definePolicyPack, no-packs ≡
  lintTheme, append-in-order, multi-pack-order, throwing rule → error warning +
  subsequent rules, filterWarnings, realistic pack fires on Aurora, tokenIds carries the
  offending id, built-in codes unchanged.
- **SC-002**: Core total **61 tests** (was 52; +9 new).
- **SC-003**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across **21 projects** (no new package).
- **SC-004**: New docs page `/guide/policy-packs` shipped; sidebar entry added.

---

## Assumptions

- The sync-only constraint is the right one. Async would force every CLI / builder /
  editor consumer to refactor. If an FI needs external data in a rule, they inject it at
  construction time.
- The `LintCode` union stays the source of autocomplete truth for built-in checks. Custom
  codes use plain strings; TS doesn't surface them in completion menus, which is the
  intended ergonomic boundary.
- Pack distribution is the FI's existing problem (monorepo / private registry). Defining
  a discovery mechanism would lock organisations into a particular packaging story.
- No auto-fix. The contract's lint is identification, not mutation.
- Removing built-in rules via a pack is **not** supported. If a built-in rule is the wrong
  shape for an FI, the right path is a wrapper around `lintWithPolicies` that filters the
  output — not a contract bypass.
