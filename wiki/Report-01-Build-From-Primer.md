# Report R1 — Building a Polymorph theme from GitHub Primer

**Test package**: `tests/integration-primer/` (private, `@polymorph/integration-primer`).
**Real published source**: [`@primer/primitives` v11.9.0](https://www.npmjs.com/package/@primer/primitives) — MIT-licensed.
**Reproduce**:
```bash
pnpm --filter @polymorph/integration-primer test
```

---

## The setup

`@primer/primitives` ships, for each of GitHub's 12+ themes, a CSS file at
`dist/css/functional/themes/<name>.css` containing every semantic token as a
`--<name>: <value>;` custom property with a JSDoc description. That's the publicly
documented consumer interface — same one GitHub's products use.

We do **the FI's adoption work**, expressed once:

1. Install Primer via npm as a dev dependency.
2. Parse `light.css` + `dark.css` + the base / functional layers via a tiny CSS-var
   parser (`primer-loader.ts`, ~110 LOC).
3. Write a mapping (`build-theme.ts`, ~360 LOC) from Primer semantic names → Polymorph
   `pm.*` ids. This is the only piece a real-world FI writes themselves.
4. Construct a complete Polymorph theme.

**No custom adapter, no contract changes.** Existing `validateTheme` / `resolveTheme` /
`lintTheme` consume the result.

## Coverage breakdown

| Polymorph token family | Primer source | Mapping |
|---|---|---|
| `pm.color.surface.*` | `--bgColor-default`, `--bgColor-muted`, `--bgColor-inset`, `--bgColor-emphasis`, `--overlay-bgColor` | 1:1 |
| `pm.color.text.body / muted / disabled / link / onInverse / onAction` | `--fgColor-*` | 1:1 |
| `pm.color.text.subtle` | (no Primer equivalent) | FI default |
| `pm.color.action.primary.*` | `--button-primary-bgColor-{rest,hover,active,disabled}` | 1:1 |
| `pm.color.action.secondary.*` | `--button-default-bgColor-{rest,active}` | 1:1 |
| `pm.color.action.secondary.rest` (dark only) | (no Primer equivalent) | FI default |
| `pm.color.action.danger.*` | `--button-danger-bgColor-{hover,active}` | 1:1 |
| `pm.color.feedback.{success,warning,error,info}` | `--fgColor-{success,attention,danger,accent}` | 1:1 |
| `pm.color.border.*` | `--borderColor-{default,muted,emphasis}`, `--focus-outlineColor` | 1:1 |
| `pm.elevation.{flat,raised,overlay}` | Primer's elevation system is composite; we synthesise from documented values | synthesised |
| `pm.space.{xs,sm,md,lg,xl}` | `--space-{xs,sm,md,lg,xl}` | 1:1 |
| `pm.radius.{control,card,full}` | `--borderRadius-{small,medium,full}` | 1:1 |
| `pm.typography.{display,heading,body,label,caption}` | `--base-text-{size,weight,lineHeight}-*` | composed |
| `pm.motion.duration.*` | `--prim-duration-N` (where present) | 1:1 with fallback |
| `pm.motion.easing.standard` | Primer's documented `cubic-bezier(0.65, 0, 0.35, 1)` | literal |
| `pm.border.width.{hairline,thin,thick}` | Primer's 1/2/3px ladder is documented but not exposed as a name we can match — synthesised |
| `pm.opacity.disabled` | (Primer doesn't standardise) | FI default `0.4` |
| `pm.size.touchTarget.min` | `--base-size-44` (when present) | 1:1 with `44px` fallback |
| `pm.size.{control,icon}.md` | (no Primer equivalent) | FI default |
| `pm.motion.duration.reduced` | (Primer doesn't carry a reduced-motion clamp) | FI default `1ms` |

**Numbers**:

- 70 tokens in the contract (42 required).
- 59 tokens resolved from real Primer values directly.
- 11 tokens use FI-supplied defaults (typically optional or per-org choices).

## Verification

```ts
// tests/00-build-theme.test.ts
const theme = buildPolymorphThemeFromPrimer(["light", "dark"]);
const result = validateTheme(theme);
expect(result.valid).toBe(true);                    // ✓ valid

const light = resolveTheme(theme, "light");
expect(Object.keys(light.tokens).length).toBeGreaterThan(50);  // ✓ 59 tokens
expect(light.tokens["pm.color.action.primary.rest"]?.value).toBe("#1f883d");
//                                                              ^ GitHub's actual brand green
```

All 4 build-time tests pass. The Primer-derived theme is a valid Polymorph theme.

## Findings

### Finding R1.1 — Primer's "primary" is GitHub's success-green

Primer 11.x ships `#1f883d` as `--button-primary-bgColor-rest`. That's GitHub's
success-green, used in product because GitHub treats the "merge this PR" action as a
positive primary. Our mapping uses it directly; an FI shipping this in production might
re-map their visual primary to Primer's `--button-secondary-bgColor-rest` or pick a
different brand token — the mapping is one config edit.

### Finding R1.2 — Primer uses `rem`, the contract is unit-agnostic

Primer's spacing and typography ship in `rem`. Polymorph's `dimension` accepts any unit
declared in the contract types. Native adapters multiply by 16 to convert. **The
`@polymorph/native-parity` normaliser was previously NOT converting `rem` for typography
fontSize**, only for plain `dimension` tokens. Discovered by this integration test;
fixed in the same PR. See [Report R3](Report-03-Adapter-Coverage).

### Finding R1.3 — Primer's font stack contains quotes; codegen + parsers must handle that

The Mona Sans font stack is
`"Mona Sans VF", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`.

The Swift / Kotlin / Dart codegens escape the inner `"` correctly. The **native-parity
parsers' typography fontFamily regex was stopping at the first quote**, capturing only
the leading backslash. Fixed in all three parsers ([Report R3](Report-03-Adapter-Coverage)).

## Why this matters

This isn't a synthetic test. The Primer integration is a **real-world FI workflow** —
import a published design system, write the mapping the FI's design-system team would
write, validate, resolve. The contract holds. The two bugs the integration uncovered are
the kind of thing pure unit tests can't surface because they require a real-world input
shape (rem typography, quoted font stacks). That's the value of the integration test.

## Next

- [Report R2 — Lint findings](Report-02-Lint-Findings)
- [Report R3 — Adapter coverage](Report-03-Adapter-Coverage)
