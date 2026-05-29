# Feature Specification: Authoring CLI Commands

**Spec ID**: 028-cli-authoring

**Created**: 2026-05-29

**Status**: Implemented

**Input**: The CLI shipped with `validate` / `lint` / `resolve` / `transform`. Three
recurring authoring workflows weren't covered: scaffolding a new theme from scratch,
diffing two themes for change review, and bringing a theme up to the current contract
when required tokens are added. This spec adds the three commands.

---

## Overview

`@polymorph/cli` gains three new commands:

| Command | Purpose |
|---|---|
| `polymorph init [--output] [--modes light,dark]` | Scaffold a minimal valid theme synthesised from the live manifest. Every required token present with placeholder values. |
| `polymorph diff <before> <after> [--json]` | Structural diff over `pm.*` paths — added / removed / changed authored tokens. |
| `polymorph migrate <file> [--output] [--json]` | Conservative upgrade: fill in newly-required tokens with placeholders, bump `contractVersion`. Never rewrites user values, never removes tokens. |

Each command is also exported in-process from `@polymorph/cli` (`buildMinimalTheme`,
`diffThemes`, `migrateTheme`) for hosts that want to embed the same logic without shelling
out.

---

## Clarifications

### Session 2026-05-29

- Q: `init` base set — bake in or synthesise? → A: **Synthesise from the live manifest.**
  Baked-in JSON would drift from the contract version on every spec bump. Synthesising
  ensures `init` always produces a theme matching the current `CONTRACT_VERSION` + token
  set.
- Q: `init` placeholder values — distinct sample palette, or intentionally identical? → A:
  **Identical (`#1f2933`).** The lint immediately warns about contrast collapse, which is
  the signal for "go customise this". A pre-themed scaffold would feel deceptively
  polished.
- Q: `migrate` aggressiveness — only add, or also rewrite stale values? → A: **Only add.**
  Migration fills the gap when the contract grows; rewriting user-authored values is a
  policy call no shipped tool can make safely. FIs that want stricter migrations layer a
  project-local script on top of `migrateTheme`.
- Q: `migrate` token removal — should it strip tokens no longer in the manifest? → A:
  **No.** Removal is the FI's call. The manifest only grows (additive changes per the
  versioning policy); even if it did shrink, silent removal would lose the FI's authored
  intent.
- Q: `diff` exit code semantics — what's the success state? → A: **`0` on identity, `1`
  on any difference, `2` on usage error.** Matches `git diff --exit-code`. Lets CI gates
  use diff as a tripwire against an approved baseline.
- Q: How does `init` handle the lack of any base theme to copy from? → A: **It doesn't
  need one.** The CLI consumes `TOKENS` from `@polymorph/spec` and walks it to build the
  scaffold. No external file needed; no example dependency.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — FI scaffolds a new theme (Priority: P1)

A design-system team starts adopting Polymorph. They run `polymorph init --output
theme.tokens.json --modes light,dark`. The resulting file is structurally valid and lints
visibly (contrast warnings, since every colour is the same placeholder). They iterate.

**Independent Test**: `tests/authoring-commands.test.ts` — `polymorph init` round-trip
produces a theme that `validateTheme` accepts; `--modes light,dark` populates both modes.

### User Story 2 — CI tripwire on theme drift (Priority: P1)

The FI's CI runs `polymorph diff approved/theme.json proposed/theme.json --json` and
gates the build on the exit code. Any authored-token change requires a PR review checkbox.

**Independent Test**: identical themes → exit 0; one-changed-value → exit 1 with a `~`
entry under the right dotted path.

### User Story 3 — Contract bump migration (Priority: P1)

A spec PR introduces a new required token. FIs run `polymorph migrate theme.json --output
theme.next.json`; the file gains the new token (with a placeholder) and the
`contractVersion` field updates.

**Independent Test**: a theme missing one required token gains it via `migrateTheme`,
`addedTokens` reports it, the migrated theme passes `validateTheme`.

### User Story 4 — Mode-sensitive migration across declared modes (Priority: P2)

A `light + dark` theme missing a newly-required mode-sensitive token gains it in **both**
modes, not just light.

**Independent Test**: removed-from-both-modes baseline → migrated theme has the token in
both modes; `addedTokens[].modes` reports `["light", "dark"]`.

### Edge Cases

- **`init --modes` includes an unknown mode**: parsed but treated as a free-form string —
  the resulting theme fails validation. (Validation surfaces the typo; CLI doesn't
  pre-filter.)
- **`migrate` on a theme that's already current**: exits `0`, reports `unchanged: true`,
  no file written when `--output` is supplied (idempotent).
- **`diff` over an invalid theme**: still works — diff is purely structural, doesn't
  validate.

---

## Requirements *(mandatory)*

- **FR-001**: `polymorph init` MUST synthesise a valid theme from `TOKENS` in
  `@polymorph/spec`. Every required token MUST be present.
- **FR-002**: `polymorph init` MUST accept `--modes <list>` and populate the mode-sensitive
  set under each listed mode. Default: `light`.
- **FR-003**: `polymorph diff <before> <after>` MUST report per-path added / removed /
  changed entries by structural equality of authored token nodes (`{$type, $value}`).
- **FR-004**: `polymorph diff` MUST exit `0` on identity, `1` on any difference, `2` on
  usage error.
- **FR-005**: `polymorph migrate` MUST only add missing required tokens. Authored values
  MUST NOT be rewritten. Tokens MUST NOT be removed.
- **FR-006**: `polymorph migrate` MUST bump `contractVersion` to the current
  `CONTRACT_VERSION` from `@polymorph/spec`.
- **FR-007**: `polymorph migrate` MUST fill mode-sensitive missing tokens across every
  declared mode in the input theme.
- **FR-008**: `buildMinimalTheme`, `diffThemes`, `migrateTheme` MUST be exported in-process
  from `@polymorph/cli` (or its `commands/` submodule).

---

## Success Criteria *(mandatory)*

- **SC-001**: `tests/authoring-commands.test.ts` — 14 tests covering: `buildMinimalTheme`
  validity, multi-mode init, `init --output` writes, `init` stdout fallback, `init --modes`,
  `diffThemes` identity / classification, `polymorph diff` identical + differ, `migrateTheme`
  fills + bumps, unchanged path, mode-sensitive fill across modes, `polymorph migrate
  --output`, `polymorph migrate --json`.
- **SC-002**: `packages/cli` total **23 tests** (was 9; +14 new).
- **SC-003**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across **21 projects** (no new package).
- **SC-004**: `docs/reference/cli.md` updated with `init`, `diff`, `migrate` sections and
  the new flags row entries.

---

## Assumptions

- Synthesising rather than baking in scaffold values is the right call. Spec bumps stay
  cheap; FIs always get a current-version scaffold.
- Conservative migration is the right default. FIs that want stricter migrations layer a
  project-local script on top of `migrateTheme`.
- Removal is never silent. Even if a future contract version shrinks the required set, the
  CLI won't strip tokens — that's an FI policy decision.
- `diff`'s success semantic matches `git diff --exit-code` — `0` on identity, non-zero on
  difference. Lets it slot into CI gates without ad-hoc wrapping.
- The CLI surface stays single-binary, single-package. No subcommand discovery, no
  plugin model — every command is a closed-set string check.
