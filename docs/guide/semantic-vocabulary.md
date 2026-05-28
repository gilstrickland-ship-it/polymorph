# The semantic vocabulary

The semantic vocabulary is the **contract**. SDKs target it and nothing below it. FIs supply
values for it (directly, or via aliases from their own primitives). 68 tokens; 41 required.

> Authoritative source: [`packages/spec/manifest/semantic-vocabulary.v0.json`](https://github.com/gilstrickland-ship-it/polymorph/blob/main/packages/spec/manifest/semantic-vocabulary.v0.json).
> The TypeScript types and JSON schema are generated from it.

## Namespace

Every token id begins with `pm.` — the reserved namespace. FI primitives may live under any
namespace they choose (`brand.*`, `palette.*`, etc.); only `pm.*` is the contract.

## Groups

| Group | Examples |
|---|---|
| `pm.color.surface.*` | `base`, `raised`, `sunken`, `overlay`, `inverse` |
| `pm.color.text.*` | `body`, `muted`, `subtle`, `onAction`, `onInverse`, `link`, `disabled` |
| `pm.color.action.*` | `primary.{rest,hover,pressed,disabled}`, `secondary.{rest,pressed}`, `danger.{rest,pressed}` |
| `pm.color.feedback.*` | `success`, `warning`, `error`, `info` |
| `pm.color.border.*` | `default`, `subtle`, `focus`, `danger` |
| `pm.typography.*` | `display`, `heading`, `body`, `label`, `caption`, `mono` (composite tokens) |
| `pm.space.*` | `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| `pm.radius.*` | `control`, `card`, `pill` |
| `pm.size.touchTarget.*` | `min`, `comfortable` |
| `pm.elevation.*` | `flat`, `raised`, `overlay` (shadow tokens) |
| `pm.motion.duration.*` | `short`, `base`, `long` |
| `pm.motion.easing.*` | `standard`, `decelerate`, `accelerate` |
| `pm.border.width.*` | `hairline`, `default`, `thick` |
| `pm.opacity.*` | `disabled`, `muted`, `overlay` |

## Required vs. optional

41 tokens are **required** — themes that omit them fail `validateTheme` with `SCHEMA_INVALID`.
The remainder are optional and only matter for surfaces that use them.

## Component tokens

Component tokens (`button.primary.background`, `input.border.focus`, …) are **optional
overrides**. Each component property declares a `defaultsFrom` semantic token; if the host
omits the override, `resolveTheme` substitutes the semantic value.

```json
{
  "components": {
    "button.primary": {
      "background": { "$type": "color", "value": "{pm.color.action.primary.rest}" },
      "radius":     { "$type": "dimension", "value": "{pm.radius.control}" }
    }
  }
}
```

After `resolveTheme(theme, mode)`, every component property has a concrete value — no `defaultsFrom`
indirection left.

## Versioning

The vocabulary is versioned explicitly. **Adding tokens** is a minor bump. **Renaming or
removing** is a major bump. The SDK pins to a vocabulary major; FIs publishing through a
remote manifest declare which major they emit.
