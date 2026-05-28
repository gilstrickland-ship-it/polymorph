# Modes & component tokens

## Modes

A theme file colocates every mode it supports. Aliases inside `tokens` may carry mode-specific
values via the DTCG-extended `modes` field:

```json
{
  "tokens": {
    "pm.color.surface.base": {
      "$type": "color",
      "value": { "modes": { "light": "#ffffff", "dark": "#0a1418" } }
    }
  }
}
```

`resolveTheme(theme, "dark")` picks the `dark` arm, follows alias chains, and emits a flat
`ResolvedTheme` whose `tokens` map carries only the selected mode's values. `light` is the
default if a token omits a particular mode.

`light`, `dark`, and `highContrast` are the recognised mode names; v1 ships `light` + `dark`
across the bank fixtures.

## Component tokens

Component tokens scope to a **role** (a stable name like `button.primary`, `input`,
`stepIndicator`) and declare per-property values. Roles + properties are listed in the
manifest; new ones are an additive change to the vocabulary.

```json
{
  "components": {
    "button.primary": {
      "background": { "$type": "color", "value": "{pm.color.action.primary.rest}" },
      "radius":     { "$type": "dimension", "value": "{pm.radius.control}" }
    },
    "input": {
      "borderFocus": { "$type": "color", "value": "{pm.color.border.focus}" }
    }
  }
}
```

Each component property declares a `defaultsFrom` in the manifest. If a theme **omits** the
override, `resolveTheme` synthesizes the property from that semantic token. So component
overrides are always optional; the SDK can always read every component property and find a
concrete value.

## What this means for adapters

After resolution, the adapter consumes a `ResolvedTheme`:

```ts
{
  mode: "dark",
  contractVersion: "0.0.0",
  tokens: { /* every semantic token, concrete value */ },
  components: { /* every component property, concrete value */ }
}
```

That is the only shape adapters know how to render. Anything FI-specific has been peeled away
upstream.
