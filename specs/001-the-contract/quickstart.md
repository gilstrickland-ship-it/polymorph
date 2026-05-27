# Quickstart: The Contract

How the three parties touch the contract once `@polymorph/spec` is implemented. This doubles as
the v1 verification walkthrough for Spec A.

## 1. FI theme author — write a minimal valid theme

Author a `*.tokens.json` with FI primitives plus a complete `light` set of the **41 required**
semantic tokens (see `contracts/semantic-vocabulary.v0.json`).

```jsonc
{
  "$schema": "node_modules/@polymorph/spec/schema/theme.schema.json",
  "contractVersion": "0.0.0",
  "palette": { "white": { "$type": "color", "$value": "#ffffff" }, "blue600": { "$type": "color", "$value": "#1f5cff" } },
  "pm": {
    "space": { "md": { "$type": "dimension", "$value": { "value": 16, "unit": "px" } } /* ...mode-invariant tokens... */ },
    "modes": {
      "light": {
        "color": {
          "surface": { "base": { "$type": "color", "$value": "{palette.white}" } },
          "action": { "primary": { "rest": { "$type": "color", "$value": "{palette.blue600}" } } }
          /* ...rest of required mode-sensitive tokens... */
        }
      }
    }
  }
}
```

## 2. Validate it

```bash
# CLI lives in @polymorph/cli (Spec B); engine in @polymorph/core
pnpm --filter @polymorph/cli exec polymorph validate ./aurora.tokens.json
# → OK, or located errors: missing required id / dangling alias / cycle / type mismatch / pm collision / partial mode
```

## 3. Vendor (SDK author) — code against semantic ids only

```ts
import type { ResolvedTheme } from "@polymorph/spec";

// the SDK references pm.* semantic ids, never FI primitives:
function primaryButtonStyle(t: ResolvedTheme) {
  return {
    backgroundColor: t.tokens["pm.color.action.primary.rest"].value,
    color:           t.tokens["pm.color.text.onAction"].value,
    borderRadius:    t.tokens["pm.radius.control"].value,
  };
}
```

## 4. Prove the thesis (verification)

- **SC-002 (two banks validate)**: validate both `aurora.tokens.json` and `borealis.tokens.json`
  against the same `theme.schema.json` — both pass, no schema change.
- **SC-001 (zero primitives in SDK)**: a lint over SDK source finds only `pm.*` ids, no primitive
  paths.
- **SC-003 (located failures)**: run the validator over each `tests/fixtures/invalid/*` theme —
  each fails naming the offending id/path.
- **SC-004 (additive compat)**: a theme valid under v0 stays valid after an additive vocabulary
  bump.
- **SC-006 (retrofit)**: feed a brownfield component the `ResolvedTheme.tokens` map — it re-skins
  across Aurora/Borealis with no structural change.

## Package test run (after implementation)

```bash
SPECIFY_FEATURE=001-the-contract pnpm --filter @polymorph/spec test
# schema.test.ts (valid + invalid fixtures), manifest.test.ts (manifest↔schema↔types), versioning.test.ts
pnpm --filter @polymorph/spec typecheck && pnpm --filter @polymorph/spec build
```
