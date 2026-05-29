# Tutorial 02 — Author a theme from scratch

**Time**: ~15 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate).

You're going to author a theme by hand — useful for understanding the contract's
vocabulary before reaching for an importer.

---

## 1. Start from a scaffold

```bash
npx polymorph init --output mybank.tokens.json --modes light,dark
```

Open `mybank.tokens.json`. It has the contract's full required-token set, all with
placeholder values.

## 2. Understand the layout

```jsonc
{
  "contractVersion": "0.0.0",
  "pm": {
    // Mode-INVARIANT — same across light / dark / highContrast
    "space":  { "xs": {...}, "sm": {...}, "md": {...}, ... },
    "radius": { "control": {...}, "card": {...}, ... },
    "typography": { "body": {...}, "heading": {...}, ... },
    "motion": { "duration": {...}, "easing": {...} },
    // Mode-SENSITIVE — colour + elevation under each mode
    "modes": {
      "light": { "color": {...}, "elevation": {...} },
      "dark":  { "color": {...}, "elevation": {...} }
    }
  }
}
```

The two key facts:

1. Every token is a DTCG node: `{ "$type": "color", "$value": "#1f5cff" }`. The contract
   types are `color`, `dimension`, `duration`, `number`, `cubicBezier`, `typography`,
   `shadow`.
2. Whether a token lives at the top of `pm.*` or under `pm.modes.<mode>` is fixed by the
   manifest — you don't decide. `validateTheme` enforces it.

## 3. Replace the placeholders

A small example — replace the surface and primary action for both modes:

```jsonc
{
  "pm": {
    "modes": {
      "light": {
        "color": {
          "surface": {
            "base":    { "$type": "color", "$value": "#ffffff" },
            "raised":  { "$type": "color", "$value": "#f6f7fb" }
          },
          "action": {
            "primary": {
              "rest":     { "$type": "color", "$value": "#1f5cff" },
              "pressed":  { "$type": "color", "$value": "#194acc" },
              "disabled": { "$type": "color", "$value": "#a8b8d0" }
            }
          }
        }
      },
      "dark": { ... }
    }
  }
}
```

Re-validate after every meaningful change:

```bash
npx polymorph validate mybank.tokens.json
```

## 4. Resolve & inspect

```bash
npx polymorph resolve mybank.tokens.json --mode light | jq '.tokens["pm.color.action.primary.rest"]'
# {
#   "$type": "color",
#   "value": "#1f5cff"
# }
```

This is the value every adapter (Web, RN, Dart, Swift, Kotlin) consumes.

## 5. Lint as you author

```bash
npx polymorph lint mybank.tokens.json --mode light
```

You'll see real-world warnings:

- `CONTRAST_TEXT_LOW` — body text on surface is below WCAG AA
- `MOTION_BASE_LONG` — base motion is over 500ms (jarring on mobile)
- `PROTECTED_CONTRAST_LOW` — the `disclosure` role's foreground is below 7:1 ([Tutorial 10](Tutorial-10-Protected-Surfaces))

Each warning carries the offending token id(s); paste them into your file and fix.

## 6. Aliases (DRY-up via reference)

Instead of repeating `#1f5cff` everywhere, define a primitive and alias it:

```jsonc
{
  "brand": {
    "blue": { "$type": "color", "$value": "#1f5cff" }
  },
  "pm": {
    "modes": {
      "light": {
        "color": {
          "action": {
            "primary": {
              "rest": { "$type": "color", "$value": "{brand.blue}" }
            }
          }
        }
      }
    }
  }
}
```

`validateTheme` resolves the alias and verifies the type matches.

## 7. Commit it

Your `mybank.tokens.json` is a normal JSON file. Commit it to the FI's design-system repo;
adapters read it at runtime (or codegen reads it at build time).

## What's next

- [Tutorial 04 — Wire the Web adapter](Tutorial-04-Web-Adapter) to see your theme render
- [Tutorial 11 — Migrate & diff](Tutorial-11-Migrate-And-Diff) when the contract grows
