# Tutorial 10 — Protected surfaces for legal disclosures & regulator-mandated copy

**Time**: ~5 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate).

A brand theme can't make a legal disclosure illegible. The contract enforces stricter
floors for component roles flagged as **protected**.

---

## The floors (today)

| Floor | Threshold | Lint code |
|---|---|---|
| Foreground / background contrast | **7:1** (WCAG SC 1.4.6 AAA-equivalent) | `PROTECTED_CONTRAST_LOW` |
| Font size | **≥ 14px** | `PROTECTED_FONT_SIZE_SMALL` |
| Line-height | **≥ 1.5×** | `PROTECTED_LINE_HEIGHT_TIGHT` |

One role is currently flagged: `disclosure`.

## How a theme satisfies the floors

The `disclosure` role defaults to `text.muted` foreground + `caption` typography — soft
on purpose, so the lint *shouts* when a theme uses defaults for protected copy. The fix
is an explicit override:

```jsonc
{
  "pm": {
    "disclosure": {
      "foreground": { "$type": "color", "$value": "#000000" },
      "typography": {
        "$type": "typography",
        "$value": {
          "fontFamily": "Inter",
          "fontWeight": 400,
          "fontSize":   { "value": 16, "unit": "px" },
          "lineHeight": 1.5,
          "letterSpacing": { "value": 0, "unit": "px" }
        }
      }
    }
  }
}
```

Three warnings cleared in one override.

## How a theme that doesn't override looks under lint

```bash
npx polymorph lint theme.tokens.json
# ⚠ [PROTECTED_CONTRAST_LOW]    disclosure.foreground on pm.color.surface.base has contrast 5.2:1, below 7:1
# ⚠ [PROTECTED_FONT_SIZE_SMALL] disclosure.typography.fontSize is 12px, below 14px
# ⚠ [PROTECTED_LINE_HEIGHT_TIGHT] disclosure.typography.lineHeight is 1.4, below 1.5
```

Real example: the GitHub Primer integration test triggers all three — Primer doesn't
have a dedicated `disclosure` semantic, so the contract's role-defaults apply, and the
floors fire. Recorded in [Report R2 — Lint findings](Report-02-Lint-Findings).

## CI gating

Like every Polymorph lint rule, protected floors are **advisory** (per Constitution
Principle VI). Gating is your call:

```ts
import { filterWarnings, lintWithPolicies, resolveTheme } from "@polymorph/core";

const warnings = lintWithPolicies(resolveTheme(theme, "light"));
const protectedWarnings = filterWarnings(warnings, (c) => c.startsWith("PROTECTED_"));

if (protectedWarnings.length > 0) {
  console.error("Compliance gate: protected-surface floors violated");
  for (const w of protectedWarnings) console.error(`  [${w.code}] ${w.message}`);
  process.exit(1);
}
```

## Surface in the builder

```css
[data-pm-lint-code^="PROTECTED_"] {
  border-left: 4px solid #d33;
  padding-left: 12px;
  background: #ffeded;
}
```

Now the `LintPanel` makes protected-floor warnings visually distinct.

## Adding new protected roles

The set is open. Future regulator-driven content surfaces (fee schedules, terms-of-service
summaries) get added to `packages/spec/manifest/protected-floors.v0.json` and the lint
picks them up automatically — no spec rebuild required:

```jsonc
{
  "floors": [
    {
      "role": "disclosure",
      "rules": [ ... existing ... ]
    },
    {
      "role": "feeSchedule",
      "rationale": "Reg-Z fee disclosures",
      "rules": [
        { "kind": "contrast", "fgProperty": "foreground", "bgToken": "pm.color.surface.base", "min": 7.0, "code": "PROTECTED_CONTRAST_LOW" },
        { "kind": "fontSize", "viaProperty": "typography", "minPx": 16, "code": "PROTECTED_FONT_SIZE_SMALL" }
      ]
    }
  ]
}
```

## What's next

- [Tutorial 08 — Policy packs](Tutorial-08-Policy-Packs) for FI-specific floors on top
- [Report R2 — Lint findings](Report-02-Lint-Findings) for real Primer-triggered floor warnings
