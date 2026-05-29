# Tutorial 08 — Add a project-local lint policy pack

**Time**: ~10 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate).

The built-in lint covers WCAG 2.1 contrast, motion-reduce, protected-surface floors,
touch/opacity/motion duration floors. Your FI has additional policies — brand-guard,
locale-specific text floors, internal compliance adds. Policy packs let you add them
without forking core.

---

## Define a pack

```ts
// packs/acme-brand-guard.ts
import { definePolicyPack, warning } from "@polymorph/core";

export const brandGuard = definePolicyPack({
  name: "acme-bank/brand-guard",
  version: "1.2.0",
  description: "Acme's protected primary palette.",
  rules: [
    (rt) => {
      const primary = rt.tokens["pm.color.action.primary.rest"]?.value;
      if (typeof primary !== "string") return [];
      if (primary.toLowerCase() !== "#003a78") {
        return [
          warning(
            "ACME_PRIMARY_DRIFT",
            `pm.color.action.primary.rest is ${primary}, expected #003a78`,
            ["pm.color.action.primary.rest"],
          ),
        ];
      }
      return [];
    },
  ],
});
```

A rule is `(ResolvedTheme) → LintWarning[]`. Pure: read tokens + component properties,
return warnings, don't throw, don't mutate.

## Run the lint with packs composed

```ts
import { lintWithPolicies, resolveTheme } from "@polymorph/core";
import { brandGuard } from "./packs/acme-brand-guard.js";

const rt = resolveTheme(theme, "light");
const warnings = lintWithPolicies(rt, [brandGuard]);
// Built-in warnings first, then pack warnings in pack-array order
```

## Multi-mode CI gate

```ts
import { lintAllModesWithPolicies } from "@polymorph/core";

const perMode = lintAllModesWithPolicies(theme, [brandGuard, accessibilityPack, localePack]);
// [{ mode: "light", warnings: [...] }, { mode: "dark", warnings: [...] }]
```

## CI gating split

`filterWarnings` isolates the subset CI should escalate:

```ts
import { filterWarnings } from "@polymorph/core";

for (const { mode, warnings } of perMode) {
  const critical = filterWarnings(warnings, (code) =>
    code.startsWith("PROTECTED_") || code.startsWith("ACME_"),
  );
  if (critical.length > 0) {
    console.error(`[${mode}] ${critical.length} critical issues:`);
    for (const w of critical) console.error(`  [${w.code}] ${w.message}`);
    process.exit(1);
  }
}
```

The contract still ships every rule as **advisory** — the split lives in your CI script.

## Robustness: rules that throw

A latent bug in a rule throws on a specific theme shape. The runtime catches it and emits
a `POLICY_RULE_ERROR` warning carrying the pack name + version + error message. The lint
pipeline never aborts mid-stream — one bad rule doesn't blind the rest of the audit.

## Real-world pack example

Here's a GitHub-Primer-aware brand-guard pack the integration test exercises:

```ts
const githubBrandGuard = definePolicyPack({
  name: "github/brand-guard",
  version: "1.0.0",
  rules: [
    (rt) => {
      const v = rt.tokens["pm.color.action.primary.rest"]?.value;
      if (typeof v === "string" && v.toLowerCase() !== "#1f883d") {
        return [warning("GITHUB_BRAND_GREEN_DRIFT", `expected #1f883d, got ${v}`, ["pm.color.action.primary.rest"])];
      }
      return [];
    },
  ],
});
```

The pack passes against the baseline Primer-derived theme; a fork that changes the brand
green trips it. See [Report R2 — Lint findings](Report-02-Lint-Findings).

## Composing with the builder

The `LintPanel` from `@polymorph/builder` renders the same `LintWarning[]` regardless of
origin. Style FI-namespaced rows with the existing selector:

```css
[data-pm-lint-code^="ACME_"] { background: #ffe6e6; border-left: 3px solid #d33; }
```

## What's next

- [Tutorial 10 — Protected surfaces](Tutorial-10-Protected-Surfaces) for the built-in floor rules packs typically extend
- [Tutorial 12 — Conformance & parity](Tutorial-12-Conformance-And-Parity) for CI gating
