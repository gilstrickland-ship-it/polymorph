---

description: "Task list for Spec AB — authoring CLI commands"
---

# Tasks: Authoring CLI Commands

**Input**: Design documents from `specs/028-cli-authoring/`.

## Phase 1: `init` (FR-001 / FR-002 / FR-008)

- [x] T001 `packages/cli/src/commands/init.ts`: `buildMinimalTheme(modes?)` walks `TOKENS` from `@polymorph/spec`, emits required-only invariant tokens under `pm.*` and required mode-sensitive tokens under `pm.modes.<mode>` for every listed mode. Placeholder values are intentionally identical (`#1f2933` for color) so the lint visibly warns.
- [x] T002 `runInit({ output?, modes? })`: writes to file (with mkdir-p) when `--output` is supplied; otherwise returns stdout for the CLI driver to emit.

## Phase 2: `diff` (FR-003 / FR-004 / FR-008)

- [x] T003 `packages/cli/src/commands/diff.ts`: `diffThemes(before, after)` walks the `pm.*` subtree of both sides, classifies each leaf path as added / removed / changed by structural equality of `{$type, $value}`.
- [x] T004 `runDiff({ beforePath, afterPath, json })`: reads + parses both files, emits human or `--json` output, returns exit 0 on identity / 1 on any change / 2 on parse error.

## Phase 3: `migrate` (FR-005 / FR-006 / FR-007 / FR-008)

- [x] T005 `packages/cli/src/commands/migrate.ts`: `migrateTheme(theme)` returns `{ migrated, report }`. The pass only adds missing required tokens — never rewrites user values, never removes tokens. Bumps `contractVersion`. Mode-sensitive missing tokens are filled across every declared mode.
- [x] T006 `runMigrate({ inputPath, output?, json })`: reads, migrates, writes / prints, returns exit code.

## Phase 4: Wiring (FR-008)

- [x] T007 `packages/cli/src/run.ts`: extend the command table to include `init` / `diff` / `migrate`; extend USAGE with the new commands + flags; route to the new run functions.
- [x] T008 `parse()` accepts `--modes <list>` (comma-separated) for `init`. Positional args collected into an array so `diff` can take two files.

## Phase 5: Tests (SC-001)

- [x] T009 `packages/cli/tests/authoring-commands.test.ts` — 14 tests covering buildMinimalTheme + every CLI command + every in-process helper.

## Phase 6: Docs

- [x] T010 `docs/reference/cli.md`: USAGE block updated, three new command subsections (`init`, `diff`, `migrate`) with examples, Common flags table updated with `--modes` and broader `--output` / `--json` applicability.

## Phase 7: Verification

- [x] T011 `pnpm --filter @polymorph/cli test` — 23 tests green (was 9; +14 new).
- [x] T012 `pnpm --filter @polymorph/docs run build` — site rebuilds, no broken links.
- [x] T013 Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **21 projects** (no new package).

## Notes

- `init` synthesises from `TOKENS`; no baked-in JSON. Spec bumps stay cheap.
- Placeholder values are intentionally identical — the lint shouts at the user to
  customise. A pre-themed scaffold would feel deceptively polished.
- `migrate` only adds. Authored value rewrites are an FI policy call, not CLI default
  behavior. Removal is never silent.
- `diff` exit semantics match `git diff --exit-code` (0/1/2 = identity/change/usage).
  CI gates use diff as a tripwire against an approved baseline.
- In-process helpers (`buildMinimalTheme`, `diffThemes`, `migrateTheme`) exported so hosts
  can embed without shelling out.
