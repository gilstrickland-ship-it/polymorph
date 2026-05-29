# Tutorial 11 — Migrate a theme across a contract bump + diff for change review

**Time**: ~10 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate).

When Polymorph's contract grows a new required token, your themes need to grow with it.
And when a teammate proposes a theme change, you want a structural diff against the
approved baseline.

---

## `polymorph diff` — structural compare between two themes

```bash
npx polymorph diff approved/theme.tokens.json proposed/theme.tokens.json
# 3 change(s):
#   ~ modes.light.color.action.primary.rest: "#003a78" → "#004c9e"
#   + opacity.muted: 0.6
#   - modes.dark.color.feedback.warning
```

Exit code semantics match `git diff --exit-code`:

- **0** — identical
- **1** — any difference
- **2** — usage error

That makes diff a CI tripwire:

```yaml
# .github/workflows/theme-review.yml
- name: Block changes without explicit review
  run: npx polymorph diff approved/theme.tokens.json HEAD/theme.tokens.json
```

JSON mode for machine consumption:

```bash
npx polymorph diff a.json b.json --json
# { "entries": [ { "kind": "changed", "path": "...", "before": ..., "after": ... }, ... ] }
```

## `polymorph migrate` — fill in newly-required tokens

When the contract grows a new required token (e.g. `pm.motion.duration.reduced` was added
in spec 023), your existing theme is suddenly missing it:

```bash
npx polymorph validate theme.tokens.json
# ✗ [SCHEMA_INVALID] /pm/motion/duration must have required property 'reduced'
```

Migrate fixes it:

```bash
npx polymorph migrate theme.tokens.json --output theme.next.tokens.json
# migrating theme.tokens.json from 0.0.0 → 0.0.0
#   + pm.motion.duration.reduced (invariant)
# ✓ wrote theme.next.tokens.json
```

The migration is **conservative**:

- Only ADDs missing required tokens with placeholder values.
- Never rewrites your authored values.
- Never removes tokens (even if they're no longer in the manifest).
- Mode-sensitive tokens fill across **every declared mode** in the input theme.

After migrating, you customise the placeholder values (the new token starts at the
contract's default `1ms` or `#1f2933` — overwrite to match your brand).

## Report-only mode

```bash
npx polymorph migrate theme.tokens.json --json
# {
#   "fromVersion": "0.0.0",
#   "toVersion": "0.0.0",
#   "addedTokens": [{ "id": "pm.motion.duration.reduced", "modes": ["light", "dark"] }],
#   "unchanged": false
# }
```

Useful when you want to see what would change without writing the file.

## Real-world: migrating a Primer-derived theme

```ts
import { migrateTheme } from "@polymorph/cli";
import { buildPolymorphThemeFromPrimer } from "@polymorph/integration-primer";

const theme = buildPolymorphThemeFromPrimer(["light", "dark"]);

// Simulate a contract bump: strip a required token.
delete theme.pm.motion.duration.reduced;

const { migrated, report } = migrateTheme(theme);
console.log(report.addedTokens);
// [{ id: "pm.motion.duration.reduced", modes: undefined }] — invariant token re-added
```

See [Report R5 — CLI authoring](Report-05-CLI-Authoring) for the full transcript.

## In-process API

If you'd rather not shell out:

```ts
import { diffThemes, migrateTheme, buildMinimalTheme } from "@polymorph/cli";

const diff = diffThemes(themeA, themeB);
const { migrated, report } = migrateTheme(theme);
const scaffold = buildMinimalTheme(["light", "dark"]);
```

All three are pure functions — useful inside the builder, in a custom CI script, or in a
bespoke theme-management surface.

## What's next

- [Tutorial 12 — Conformance & parity](Tutorial-12-Conformance-And-Parity) for the rest of the CI gate
- [Tutorial 08 — Policy packs](Tutorial-08-Policy-Packs) for FI-specific lint gates
