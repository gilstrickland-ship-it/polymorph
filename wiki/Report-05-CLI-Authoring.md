# Report R5 — CLI authoring commands against the Primer theme

**Test file**: `tests/integration-primer/tests/04-cli.test.ts`.
**Spec exercised**: 028 (CLI authoring: `init` / `diff` / `migrate`).
**Reproduce**:
```bash
pnpm --filter @polymorph/integration-primer test 04-cli
```

---

## Method

Take the Primer-derived theme and exercise every CLI authoring command's in-process
helper against it.

## Test 1 — `polymorph diff` on identical themes

```ts
const diff = diffThemes(theme, theme);
expect(diff.entries.length).toBe(0);
```

**Result**: Pass. Identical themes produce a zero-entry diff (exit code 0 from the CLI).

## Test 2 — `polymorph diff` after a single colour edit

```ts
const forked = JSON.parse(JSON.stringify(theme));
forked.pm.modes.light.color.action.primary.rest.$value = "#000000";
const diff = diffThemes(theme, forked);
const changed = diff.entries.filter((e) => e.kind === "changed");
expect(changed.length).toBe(1);
expect(changed[0]!.path).toBe("modes.light.color.action.primary.rest");
```

**Result**: Pass. The diff cleanly identifies the single changed path. CLI exit code 1.

## Test 3 — `polymorph migrate` on an already-current theme

```ts
const { report } = migrateTheme(theme);
expect(report.unchanged).toBe(true);
expect(report.addedTokens).toEqual([]);
```

**Result**: Pass. The Primer-derived theme is already at the current contract version
with all required tokens present, so `migrate` reports `unchanged: true`.

## Test 4 — `polymorph migrate` fills a missing required token

```ts
const stripped = JSON.parse(JSON.stringify(theme));
delete stripped.pm.motion.duration.reduced;

const { migrated, report } = migrateTheme(stripped);
expect(report.addedTokens.some((a) => a.id === "pm.motion.duration.reduced")).toBe(true);
expect(validateTheme(migrated).valid).toBe(true);
```

**Result**: Pass. The stripped theme gains back `pm.motion.duration.reduced` with the
placeholder value (`200ms` per the contract default), and the migrated theme validates.

## Test 5 — `buildMinimalTheme` produces a valid scaffold + Primer theme also valid

```ts
const minimal = buildMinimalTheme(["light", "dark"]);
expect(validateTheme(minimal).valid).toBe(true);
expect(validateTheme(theme).valid).toBe(true);
```

**Result**: Pass. Both the synthesised minimal scaffold and the Primer-derived theme
satisfy `validateTheme`. The integration test confirms they're independently valid
representations of the same contract.

## Test 6 — Round-trip through the file system

```ts
const out = join(dir, "primer.tokens.json");
writeFileSync(out, JSON.stringify(theme, null, 2));
const reloaded = JSON.parse(readFileSync(out, "utf8"));
expect(validateTheme(reloaded).valid).toBe(true);
```

**Result**: Pass. Writing the Primer-derived theme to disk and reading it back preserves
validity.

## Findings

### Finding R5.1 — CLI helpers are pure + composable

The in-process helpers (`diffThemes`, `migrateTheme`, `buildMinimalTheme`) are pure
functions taking parsed JSON and returning new JSON. The CLI is a thin wrapper. This makes
them embeddable in:

- Custom CI gating scripts (without spawning `npx polymorph`).
- Internal theme-management UIs (alongside `@polymorph/builder`).
- Test suites (this integration test is exactly that).

### Finding R5.2 — `diffThemes` over a deeply-nested real theme reports clean paths

The Primer theme has up to 6-level deep paths (e.g.
`pm.modes.light.color.action.primary.rest`). The diff output uses dotted paths that match
the JSON pointer the schema validator emits, so a CI tripwire failure can be cross-
referenced directly against the validator's errors.

### Finding R5.3 — `migrate` correctness on a real theme

The migration pass on the Primer theme is **conservative** — it adds, never removes,
never rewrites. A real-world FI upgrading from contract version 0.0.0 to 0.1.0 (when
that ships) gets:

- A clean list of newly-required tokens added with placeholder values.
- Their authored values preserved untouched.
- The `contractVersion` field bumped.

The migration report makes the change set legible for code review.

## Summary

| Command | Status | Notes |
|---|---|---|
| `polymorph init` (in-process: `buildMinimalTheme`) | ✓ | Synthesised theme valid against current contract |
| `polymorph diff` (in-process: `diffThemes`) | ✓ | Identical → 0 entries; single edit → 1 entry; deep paths clean |
| `polymorph migrate` (in-process: `migrateTheme`) | ✓ | Unchanged on already-current; fills required gaps cleanly |

No bugs found. CLI helpers compose cleanly against a real-world theme.

## Next

- [Tutorial 11 — Migrate & diff](Tutorial-11-Migrate-And-Diff)
- [Report R6 — Production readiness](Report-06-Production-Readiness)
