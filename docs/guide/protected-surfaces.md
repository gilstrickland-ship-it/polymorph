# Protected surfaces

Some component roles hold **regulated content** — legal disclosures, regulator-mandated
copy, accessibility statements. These surfaces must always meet a stricter legibility bar
than the WCAG AA baseline the rest of the lint uses, regardless of what theme is applied.

The contract enforces this with a **floors manifest** + matching lint rules:

| Floor | Threshold | Lint code |
|---|---|---|
| Foreground / background contrast | **7:1** (WCAG SC 1.4.6 AAA-equivalent) | `PROTECTED_CONTRAST_LOW` |
| Font size | **≥ 14px** | `PROTECTED_FONT_SIZE_SMALL` |
| Line-height | **≥ 1.5×** | `PROTECTED_LINE_HEIGHT_TIGHT` |

Today, one role is flagged: `disclosure`. The set is open — future regulator-driven
content surfaces (e.g. fee schedules, terms-of-service summaries) get added to
`protected-floors.v0.json` and the lint picks them up automatically.

## How a theme satisfies the floors

The `disclosure` role's defaults are intentionally soft (`text.muted` foreground + `caption`
typography — small, low-contrast). FIs that surface protected copy override the role to use
body-class values:

```json
{
  "pm": {
    "disclosure": {
      "foreground": { "$type": "color", "$value": "#000000" },
      "typography": {
        "$type": "typography",
        "$value": {
          "fontFamily": "Inter",
          "fontWeight": 400,
          "fontSize": { "value": 16, "unit": "px" },
          "lineHeight": 1.5,
          "letterSpacing": { "value": 0, "unit": "px" }
        }
      }
    }
  }
}
```

That's three lint warnings cleared in one override.

## Why advisory, not blocking

Like every Polymorph lint rule, protected floors are **advisory** — they surface in
`LintWarning[]`, never throw, never block `validateTheme`. FIs decide how to gate. Common
patterns:

- **CI gate**: any `PROTECTED_*` warning fails the pipeline.
- **Editor surfacing**: `@polymorph/builder`'s `LintPanel` renders them with a stronger
  visual treatment via `data-pm-lint-code="PROTECTED_*"`.
- **Compliance review**: a periodic audit reads `lintAllModes(theme)`, files any
  `PROTECTED_*` warning as a compliance ticket.

The lint is the signal; the policy is yours.

## Why a separate floors manifest

The floors aren't part of `semantic-vocabulary.v0.json` because they're a **lint-level**
concern, not a structural one. A `disclosure` role with a 12px caption is still a
structurally valid theme — `validateTheme` returns `true`. The floors live alongside the
manifest (`packages/spec/manifest/protected-floors.v0.json`) so:

- Future floors don't churn the schema generator.
- Versioning is independent — the floors file can tighten thresholds without bumping the
  contract version.
- Consumers (`@polymorph/core`'s `lintTheme`) import `PROTECTED_FLOORS` as data, not as a
  generated type.

## Composing with the rest of the lint

Protected floors fire **in addition to** the standard contrast / non-text / motion / etc.
rules. A disclosure that's both small AND low-contrast gets a `PROTECTED_FONT_SIZE_SMALL`
*and* a `PROTECTED_CONTRAST_LOW` *and* (separately) the usual `CONTRAST_TEXT_LOW` if the
underlying `text.muted` is also below standard-text contrast on the surface.

The codes are independent on purpose — a fix that lifts the standard `CONTRAST_TEXT_LOW`
might still leave `PROTECTED_CONTRAST_LOW` warning if the FI lifts contrast to 5:1
(passing AA) without going all the way to 7:1 (passing AAA-equivalent).

## What this doesn't ship

- **A blocking enforcement mode.** Lint stays advisory per the constitution. CI gates are
  the FI's call.
- **Per-FI floor customisation.** The floors are the contract's promise — they don't
  flex. FIs that want stricter thresholds add a project-local lint pass.
- **Adapter-level enforcement.** No adapter emits `!important` overrides or CSS guards.
  The floors are about the *theme being authored correctly* — not about overriding what a
  theme says at runtime.
- **Auto-fix.** The lint identifies; the FI's compliance + design teams decide the fix.

## See also

- [Advisory lint](/guide/advisory-lint) — the full lint rule catalogue.
- [`@polymorph/builder`](/guide/builder) — `LintPanel` styles `PROTECTED_*` codes via
  `data-pm-lint-code` selectors.
