# Project-local policy packs

`@polymorph/core` ships an advisory lint covering WCAG 2.1 contrast, motion-reduce,
protected surfaces, touch / opacity floors, and base motion duration. That's the
**contract's** policy set — it captures rules every Polymorph adopter benefits from.

FIs frequently have their own policies on top — brand-guard rules, locale-specific text
floors, fee-disclosure-style additions to the protected surface set. Forking the linter to
add them is the wrong shape. **Policy packs** are the right one.

## What a policy pack is

A small object: a name, a version, an array of rule functions. Each rule receives the
resolved theme and returns any warnings it wants to add:

```ts
import { definePolicyPack, warning } from "@polymorph/core";

export const brandGuard = definePolicyPack({
  name: "acme-bank/brand-guard",
  version: "1.2.0",
  description: "Acme Bank's protected primary palette.",
  rules: [
    (rt) => {
      const primary = rt.tokens["pm.color.action.primary.rest"]?.value;
      if (typeof primary !== "string") return [];
      if (primary.toLowerCase() !== "#003a78") {
        return [
          warning(
            "ACME_PRIMARY_DRIFT",
            `pm.color.action.primary.rest is ${primary}, expected #003a78 (Acme Brand Blue)`,
            ["pm.color.action.primary.rest"],
          ),
        ];
      }
      return [];
    },
  ],
});
```

Run the lint with the pack composed in:

```ts
import { lintWithPolicies, resolveTheme } from "@polymorph/core";

const rt = resolveTheme(theme, "light");
const warnings = lintWithPolicies(rt, [brandGuard]);
```

For multi-mode CI gates, `lintAllModesWithPolicies(theme, packs)` parallels the built-in
`lintAllModes` — returns one `{ mode, warnings }` entry per declared mode:

```ts
import { lintAllModesWithPolicies } from "@polymorph/core";

const perMode = lintAllModesWithPolicies(theme, [brandGuard]);
// [{ mode: "light", warnings: [...] }, { mode: "dark", warnings: [...] }]
```

The result is the **built-in warning set followed by every pack's warnings, in pack-array
order, in rule-array order within each pack**. CI can compare diffs deterministically;
editors (`@polymorph/builder`) can style FI-namespaced rows independently.

## Rule shape

A rule is a pure `(rt: ResolvedTheme) → LintWarning[]` function:

| Field | Notes |
|---|---|
| `code` | FI-namespaced (e.g. `BANK_*`, `ACME_*`). Any string passes — the built-in `LintCode` union narrows for autocomplete on built-in rules only. |
| `message` | Free-text. Surfaced in `LintPanel`, CLI output, audit logs. |
| `tokenIds` | The `pm.*` ids the rule touched. Lets editors scroll-to-warning. |
| `measured` / `threshold` | Optional numeric pair. Omit for codes that don't carry a numeric pair (`ACME_PRIMARY_DRIFT` etc.); set both when the lint panel should show "X above Y" UI. |

Use the `warning()` helper to keep call-sites terse — `measured` / `threshold` are
optional:

```ts
// Code without a numeric pair.
warning("ACME_PRIMARY_DRIFT", "pm.color.action.primary.rest drifted from brand", [
  "pm.color.action.primary.rest",
]);

// Code that carries one — surfaces "1.2 below 4.5" in the lint panel.
warning("ACME_FLOOR", "below floor", ["pm.x"], 1.2, 4.5);
```

## What rules can / can't do

Rules **can** read any resolved token (`rt.tokens[id].value`), any component-role property
(`rt.components[role][property]`), and the active mode (`rt.mode`). They're pure functions
over a value snapshot.

Rules **can't** do I/O, mutate the resolved theme, or rely on side effects. If a rule
throws, the runtime catches it and emits a synthetic `POLICY_RULE_ERROR` warning carrying
the pack name + version + error message. The lint pipeline never aborts mid-stream.

## CI gating

The `filterWarnings` helper isolates the subset a CI gate cares about. Typical pattern:
escalate `PROTECTED_*` rules and FI-defined criticals into a build failure; let the rest
stay advisory.

```ts
import { filterWarnings } from "@polymorph/core";

const critical = filterWarnings(warnings, (code) =>
  code.startsWith("PROTECTED_") || code === "ACME_PRIMARY_DRIFT",
);
if (critical.length > 0) {
  console.error(critical.map((w) => w.message).join("\n"));
  process.exit(1);
}
```

The split lives entirely in the FI's CI script — the contract still ships every rule as
advisory, per Constitution Principle VI (advisory-not-blocking).

## Composing with `@polymorph/builder`

`LintPanel` renders the same `LintWarning[]` regardless of where the code came from. Style
FI-namespaced rows with the same `data-pm-lint-code` selector — e.g.
`[data-pm-lint-code^="ACME_"]` for Acme-pack rows. The builder doesn't distinguish; the
display layer does.

## Versioning a pack

Pick whatever scheme fits your release pipeline (SemVer is the common default). The pack's
`version` field surfaces in the `POLICY_RULE_ERROR` message if a rule throws, so the
audit trail tells you which version of which pack misbehaved.

## What this doesn't ship

- **A pack registry.** Packs are plain TS objects — distribute them however your monorepo
  / private registry / shared package already does. We don't define a discovery mechanism.
- **Async rules.** Lint stays synchronous and pure. If your rule needs external data,
  inject it at construction (`definePolicyPack({ rules: [(rt) => ruleAgainst(rt,
  preFetchedData)] })`).
- **Auto-fix.** Like the built-in lint, packs identify; they don't mutate. Auto-fix lives
  outside the contract.
- **Removing built-in rules.** Packs add; they don't subtract. Built-in rules are the
  contract's promise. If a built-in rule is the wrong shape for your org, the right path is
  a `tooling/eslint-config`-style internal wrapper that filters the output — not a contract
  bypass.

## See also

- [Advisory lint](/guide/advisory-lint) — the built-in rule catalogue.
- [Protected surfaces](/guide/protected-surfaces) — the contract's strict floors for
  regulated content. Project-local packs typically *extend* this rather than replace it.
- [`@polymorph/builder`](/guide/builder) — `LintPanel` renders FI-namespaced rows
  alongside built-in ones.
