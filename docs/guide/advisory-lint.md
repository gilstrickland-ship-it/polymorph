# Advisory lint

`@polymorph/core`'s `lintTheme(resolved)` runs an advisory WCAG 2.1 contrast + perceptual
check against a resolved theme. The CLI exposes it as `polymorph lint`. The linter is
**strong and loud** by default; the host owns whether warnings gate a release (`--strict`).

## What it checks

The linter is **manifest-driven**: it derives surface, text, action, feedback, and component
pairings from the contract manifest rather than from a hand-listed set. As the vocabulary
grows, the checks grow with it.

### Contrast rule families

| Family | Code | Threshold | Pairings |
|---|---|---|---|
| Body / muted / link text on any surface | `CONTRAST_TEXT_LOW` | 4.5 (SC 1.4.3) | every `color.text` × every `color.surface.{base,raised,sunken,overlay}` |
| Disabled text on any surface | `DISABLED_TEXT_LOW` | 3.0 (AA Large) | `text.disabled` × every named surface |
| Text on actionable backgrounds | `CONTRAST_ON_ACTION_LOW` | 4.5 | `text.onAction` × every `action.{primary,secondary,danger}.{rest,hover,pressed}` |
| Inverse-surface text | `CONTRAST_ON_INVERSE_LOW` | 4.5 | `text.onInverse` × `surface.inverse` |
| Feedback accents as text | `CONTRAST_FEEDBACK_LOW` | 4.5 | each `feedback.{success,warning,error,info}` × `surface.base` |
| Focus ring visibility | `FOCUS_RING_LOW` | 3.0 (SC 1.4.11) | `border.focus` × `surface.base` |
| Default border visibility | `BORDER_DEFAULT_LOW` | 3.0 (SC 1.4.11) | `border.default` × `surface.base` |
| Component fg/bg | `COMPONENT_CONTRAST_LOW` | 4.5 (fg) / 3.0 (border-only) | per role: `<role>.foreground` × `<role>.background`, or `<role>.border` × `<role>.background` |

Every pairing accepts any CSS Color 4 form (`#hex`, `rgb()`, `hsl()`, `oklch()`, `oklab()`,
`color(display-p3 …)`) — the contrast helper normalises through `@polymorph/core.parseColor`.

### Perceptual / motion rules

| Family | Code | Threshold |
|---|---|---|
| Touch-target size | `TOUCH_TARGET_SMALL` | `pm.size.touchTarget.min` < 44px |
| Disabled opacity | `DISABLED_OPACITY_HIGH` | `pm.opacity.disabled` > 0.6 |
| Base motion duration | `MOTION_BASE_LONG` | `pm.motion.duration.base` > 500ms |
| Reduced-motion clamp | `MOTION_REDUCED_EXCEEDS_SHORT` | `pm.motion.duration.reduced` > `pm.motion.duration.short` |

### Diagnostics

`CONTRAST_SKIPPED_UNPARSEABLE` surfaces when a pairing contains an unparseable colour
(`currentColor`, gradients, unsupported colour spaces). The pair is reported but doesn't
fail; an FI can decide whether unevaluated pairings are tolerable.

## Behaviour

By default `polymorph lint` exits `0` even when warnings fire — the linter is **advisory**.
`--strict` flips that: any warning is exit `1`.

```bash
$ pnpm polymorph lint examples/mock-bank-aurora/theme/aurora.tokens.json
⚠ [DISABLED_TEXT_LOW]    text disabled (pm.color.text.disabled on pm.color.surface.base) has contrast 2.47:1, below 3:1
⚠ [CONTRAST_FEEDBACK_LOW] feedback text (pm.color.feedback.warning on pm.color.surface.base) has contrast 2.95:1, below 4.5:1
⚠ [BORDER_DEFAULT_LOW]    default border (pm.color.border.default on pm.color.surface.base) has contrast 1.33:1, below 3:1
$ echo $?
0

$ pnpm polymorph lint ... --strict
$ echo $?
1
```

## Linting every mode at once

```ts
import { lintAllModes } from "@polymorph/core";

const results = lintAllModes(themeJson);
// [ { mode: "light", warnings: [...] }, { mode: "dark", warnings: [...] } ]
```

Useful for CI gates that want one pass to cover the whole theme. Each warning is tagged with
the mode it surfaced in.

## Why advisory?

The constitution defers final compliance to the host. Polymorph's job is to **fail loud**, not
to gate. A bank's design team may knowingly accept a sub-AA pairing on a non-critical surface
(e.g., an outline-button pattern that deliberately uses body text on a neutral fill, scoring
3.2:1); the SDK shouldn't refuse to render in that case.

If you need a hard gate, wire `polymorph lint --strict` into your CI / release process. You
can also filter by code:

```bash
pnpm polymorph lint theme.tokens.json --json | jq '.[] | select(.code != "DISABLED_TEXT_LOW")'
```

…to ignore an accepted family while still gating the rest.

## What it doesn't check

- **Real reading scenarios** — the linter operates on token pairs, not on rendered surfaces.
  Adapter-level golden screenshots (`@polymorph/golden-web`) cover real rendering paths.
- **Per-locale typography** — `font-size` + `line-height` on Latin scripts is the implicit
  baseline; the linter doesn't read CJK / RTL guidance.
