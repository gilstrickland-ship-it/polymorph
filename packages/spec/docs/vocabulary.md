# Semantic Vocabulary (v0)

The purpose-named tokens an SDK codes against. **SDK code references `pm.*` semantic ids only —
never FI primitives.** The authoritative, machine-readable list is
[`../manifest/semantic-vocabulary.v0.json`](../manifest/semantic-vocabulary.v0.json); this page
is a human summary.

- **68 tokens** total — **41 required**, 27 optional.
- All ids are under the reserved **`pm`** namespace.
- Interactive states are flat sub-ids (e.g. `pm.color.action.primary.pressed`).
- `typography` is the constrained composite (`fontFamily`, `fontWeight`, `fontSize`,
  `lineHeight`, `letterSpacing`).

## Groups

| Group | Type | Notes |
|---|---|---|
| `pm.color.surface.*` | color | base / raised (req) + sunken / overlay / inverse |
| `pm.color.text.*` | color | body / muted / onAction / link / disabled (req) + subtle / onInverse |
| `pm.color.action.{primary,secondary,danger}.*` | color | rest / pressed states; `primary.disabled` required |
| `pm.color.feedback.*` | color | success / warning / error (req) + info |
| `pm.color.border.*` | color | default / focus (req) + subtle / strong |
| `pm.typography.*` | typography | heading / body / label / caption (req) + display / headingSm / bodyStrong / mono |
| `pm.space.*` | dimension | none / xs / sm / md / lg / xl (req) + 2xl / 3xl |
| `pm.radius.*` | dimension | none / control / card (req) + pill / full |
| `pm.border.width.*` | dimension | hairline / thin (req) + thick |
| `pm.elevation.*` | shadow | flat / raised (req) + overlay — mode-sensitive |
| `pm.opacity.*` | number | disabled (req) + muted / scrim |
| `pm.motion.duration.*` / `pm.motion.easing.*` | duration / cubicBezier | short / base / standard (req) |
| `pm.size.*` | dimension | control.md / touchTarget.min / icon.md (req) + control.sm/lg |

Mode-sensitive groups (`pm.color.*`, `pm.elevation.*`) are authored per mode under
`pm.modes.<light|dark|highContrast>`; everything else is defined once under `pm.*` and shared
across modes (see [`adoption-retrofit.md`](./adoption-retrofit.md) and the contract conventions).

## Required-token checklist

A minimal valid `light` theme must supply all 41 required tokens. Generate the current checklist
from the manifest:

```bash
node -e 'const m=require("@polymorph/spec/manifest/semantic-vocabulary.v0.json");console.log(m.tokens.filter(t=>t.required).map(t=>t.id).join("\n"))'
```
