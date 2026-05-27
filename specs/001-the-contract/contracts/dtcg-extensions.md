# Contract: DTCG Extensions (the three conventions)

Polymorph's contract is **DTCG 2025.10** plus exactly three documented conventions. Per
Constitution Principle II, these are additive; where any convention conflicts with DTCG, DTCG
governs.

## Convention 1 — Reserved `pm` namespace

- All contract-defined tokens live under a top-level `pm` group: `pm.color.*`, `pm.typography.*`,
  `pm.space.*`, `pm.<component>.*`, `pm.modes.*`.
- FI **primitive** tokens MUST live outside `pm` (any FI-chosen group, e.g. `palette`, `scale`).
- Semantic tokens reference primitives with standard DTCG alias syntax: `"$value": "{palette.blue.600}"`.
- **Validation**: any token under `pm` whose id is not a recognized contract id → *error* if it
  shadows a reserved path; *warning* if it looks like a typo of a known id (Edge Cases).

## Convention 2 — Parallel per-mode token sets

- DTCG 2025.10 does not standardize modes. A theme expresses modes as **complete per-mode sets**
  of the mode-sensitive semantic tokens under `pm.modes.<mode>`, where `<mode>` ∈
  `light | dark | highContrast`.
- `light` is **required** and is the default. `dark` / `highContrast` are optional; when present
  each MUST define the full **required** mode-sensitive set (manifest `modeSensitive: true`).
- **Mode-invariant** tokens (`modeSensitive: false` — spacing, radii, typography, motion, sizing,
  border widths, opacity) are defined once under `pm.*` and shared across modes.

```jsonc
{
  "$schema": "../schema/theme.schema.json",
  "contractVersion": "0.0.0",
  "palette": { "blue600": { "$type": "color", "$value": "#1f5cff" }, "ink": { "$type": "color", "$value": "#0b1020" } },
  "pm": {
    "space": { "md": { "$type": "dimension", "$value": { "value": 16, "unit": "px" } } },
    "modes": {
      "light": {
        "color": {
          "surface": { "base": { "$type": "color", "$value": "{palette.white}" } },
          "action": { "primary": { "rest": { "$type": "color", "$value": "{palette.blue600}" } } }
        }
      },
      "dark": {
        "color": {
          "surface": { "base": { "$type": "color", "$value": "{palette.ink}" } },
          "action": { "primary": { "rest": { "$type": "color", "$value": "{palette.blue400}" } } }
        }
      }
    }
  }
}
```

> The exact placement (`pm.modes.<mode>.*` sibling groups vs. per-token `$extensions` mode maps)
> is finalized in `/speckit-tasks`; sibling groups (shown) is the recommended, DTCG-vanilla form.

## Convention 3 — Optional component-token layer

- Role-scoped overrides addressed as `pm.<component>.<variant>.<property>` (e.g.
  `pm.button.primary.radius`).
- Entirely **optional** (FR-008). Each property has a documented `defaultsFrom` semantic token
  (see `semantic-vocabulary.v0.json` → `componentRoles`).
- Roles are a **closed set** in v0 (manifest `componentRoles`); an unknown role → *error*.
- Component tokens MAY be mode-scoped under `pm.modes.<mode>` when they override a mode-sensitive
  value; otherwise they sit under `pm.<component>.*`.

## What stays pure DTCG

`$type`, `$value`, `$description`, `$extensions`, alias references, groups, and all value shapes
(`color`, `dimension {value,unit}`, `typography` composite, `shadow`, `duration {value,unit}`,
`cubicBezier`, `number`) are unmodified DTCG. Polymorph adds **no custom `$type`**.
