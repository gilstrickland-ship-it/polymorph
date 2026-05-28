# Advisory lint

`@polymorph/core`'s `lintTheme(resolved)` runs an advisory WCAG 2.1 contrast check across the
surface-vs-text pairs in the resolved theme. The CLI exposes it as `polymorph lint`.

## What it checks

- **Body text on every named surface** — `pm.color.text.body` paired with each
  `pm.color.surface.*`, `pm.color.action.*`, and `pm.color.feedback.*` value.
- **`onAction` / `onInverse` overrides** — the inverted text pairings on actionable backgrounds.
- **Component-level pairings** — `button.primary.{background, text}`, `input.{background,
  textBody}`, etc., where the component declares a foreground/background pair.

Each pairing computes the WCAG 2.1 contrast ratio against the resolved sRGB triple. Inputs in
any CSS Color 4 form (`#hex`, `rgb()`, `hsl()`, `oklch()`, `oklab()`,
`color(display-p3 …)`) are normalised through `@polymorph/core.parseColor`.

## Behaviour

By default `polymorph lint` exits `0` even when warnings fire — the linter is **advisory**.
`--strict` flips that: any warning is exit `1`.

```bash
$ pnpm polymorph lint examples/mock-bank-aurora/theme/aurora.tokens.json
⚠ [WCAG_AA_FAIL] pm.color.text.body on pm.color.surface.sunken: 3.94 < 4.5 (AA body)
⚠ [WCAG_AA_LARGE_OK] pm.color.text.body on pm.color.feedback.warning: 3.21 (AA large only)
$ echo $?
0

$ pnpm polymorph lint ... --strict
$ echo $?
1
```

## Why advisory?

The constitution defers final compliance to the host. Polymorph's job is to **fail loud**, not
to gate. A bank's design team may knowingly accept a sub-AA pairing on a non-critical surface;
the SDK shouldn't refuse to render in that case.

If you need a hard gate, wire `polymorph lint --strict` into your CI / release process.

## What it doesn't check

- **Touch-target sizes** — covered by the schema (`pm.size.touchTarget.min` ≥ 44 with a soft
  warning at 32).
- **Motion / reduced-motion** — the contract carries the tokens but the linter doesn't enforce
  a "must provide reduce" policy. Hosts that need it write a project-local lint pass against
  the resolved theme.
- **Real reading scenarios** — the linter operates on token pairs, not on rendered surfaces.
  Adapter-level golden screenshots (`@polymorph/golden-web`) cover real rendering paths.
