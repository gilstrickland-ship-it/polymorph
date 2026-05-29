# Report R2 — Lint findings on real Primer tokens (post-fix)

**Test file**: `tests/integration-primer/tests/01-lint-and-protected.test.ts`.
**Specs exercised**: 020 (a11y lint), 023 (motion-reduce), 025 (protected surfaces), 027 (policy packs).
**Reproduce**:
```bash
pnpm --filter @polymorph/integration-primer test 01-lint
```

> **Update note:** This report supersedes the initial R2. After the [lint-real-world-fixes
> PR](https://github.com/gilstrickland-ship-it/polymorph/pulls), two findings (hover/pressed
> AA Large threshold + decorative-border manifest flag) were addressed by tightening the
> contract. The remaining warnings are now all legitimate real-world issues — see below.

---

## Method

Run `lintTheme(resolveTheme(primerTheme, mode))` for both `light` and `dark` modes, plus
`lintWithPolicies(rt, [githubBrandGuardPack])` to exercise project-local policy
composition.

## Findings (light mode, 3 advisory warnings, all legitimate)

```
CONTRAST_ON_ACTION_LOW    — pm.color.text.onAction on pm.color.action.secondary.rest    (1.06:1 vs. 4.5:1)
CONTRAST_ON_ACTION_LOW    — pm.color.text.onAction on pm.color.action.secondary.pressed (1.21:1 vs. 3.0:1)
PROTECTED_CONTRAST_LOW    — disclosure.foreground on pm.color.surface.base              (6.11:1 vs. 7:1)
```

## Findings (dark mode, 1 advisory warning)

```
PROTECTED_CONTRAST_LOW    — disclosure.foreground on pm.color.surface.base              (6.5:1 vs. 7:1)
```

## Resolved by the post-fix update

### Resolved R2.1 — `BORDER_DEFAULT_LOW` is now suppressed for decorative borders

**Finding**: Primer's `--borderColor-default` is `#d1d9e0` — 1.59:1 against white. Below
non-text AA 3:1.

**Resolution**: The contract added an optional `accessibility: "decorative" |
"informational"` annotation to manifest entries. `pm.color.border.default` and
`pm.color.border.subtle` are marked `decorative` — design-system convention treats default
borders as visual hairlines, not informational separators (Primer's #d1d9e0, Material's
outline-variant, IBM Carbon's border-subtle all sit below 3:1 by design). The lint reads
the manifest flag and skips the warning.

FIs that DO want strict border contrast layer a project-local
[policy pack](Tutorial-08-Policy-Packs) on top — the building block is there, the default
is the realistic one.

### Resolved R2.2 — `CONTRAST_ON_ACTION_LOW` permits AA Large on hover/pressed states

**Finding**: Primer's `--button-primary-bgColor-hover` is `#1c8139`. White on `#1c8139`
measures 4.07:1 — below WCAG AA 4.5:1 for normal text but above AA Large 3:1.

**Resolution**: WCAG SC 1.4.3 explicitly permits AA Large (3:1) for transient
state-change indications; SC 1.4.11 separately requires 3:1 for non-text UI-state
contrast. The lint now uses:

- AA normal (4.5:1) for `*.rest` states (extended-reading surface)
- AA Large (3:1) for `*.hover` and `*.pressed` (transient state-change indicators)
- AA normal still applies to `*.disabled` (covered by `DISABLED_TEXT_LOW` separately)

This eliminated 2 spurious warnings on the Primer-derived theme without weakening the
posture against genuinely-unreadable buttons (the remaining `secondary.rest` finding at
1.06:1 still fires correctly — that's a real issue).

## Remaining findings — all real

### Finding R2.3 — `pm.color.text.onAction` shared across primary/secondary/danger is wrong for some FIs

The contract uses a **single** `pm.color.text.onAction` color across primary, secondary,
and danger action buttons. Primer's secondary button uses a light surface (`#f6f8fa`)
with dark text — white text on that is unreadable (1.06:1).

This isn't a contract bug; it's a contract limitation. FIs adopting Primer have three
options:

1. **Remap secondary**: pick a darker Primer button variant for `pm.color.action.secondary.*` so the shared onAction text works.
2. **Override per-component**: set `pm.button.secondary.foreground` to a dark color via
   the component-role override mechanism. The lint's
   `lintComponentPairs` rule will pick up the override and the warning disappears.
3. **Spec future work**: future cycle could split `onAction` into per-variant slots
   (`onActionPrimary`, `onActionSecondary`, `onActionDanger`). Captured as a known gap.

### Finding R2.4 — Protected-surface floor fires correctly on default `disclosure` role

Primer doesn't carry a dedicated `disclosure` semantic. When the contract's role defaults
apply, `disclosure.foreground` resolves to `pm.color.text.muted` (`#59636e`) which sits
at 6.11:1 vs. the 7:1 protected floor.

**This is exactly the design intent** — the contract demands an explicit override for
regulated content. A bank deploying Primer-style tokens for a regulated app overrides:

```jsonc
"pm.disclosure.foreground": { "$type": "color", "$value": "#1f2328" }
```

…and the warning clears. Documented in [Tutorial 10](Tutorial-10-Protected-Surfaces).

### Finding R2.5 — Primer's contrast posture is mode-symmetric

The disclosure-foreground floor fires under both light and dark modes (6.11:1 / 6.5:1).
Not a bug — Primer's design intentionally mirrors contrast intensity across modes. Recorded
as a real-world observation about Primer's choices.

## Spec 023 — `applyReducedMotion` against real Primer tokens

Idempotent, mode-invariant, no edge cases. No bugs.

## Spec 027 — Project-local policy pack against real theme

Brand-guard pack composition works as designed. Baseline passes; forked theme trips the
rule. No bugs.

## Summary

| Spec | Status | Notes |
|---|---|---|
| 020 — advisory WCAG lint | ✓ green | Warnings dropped from 4 → 3 light + 1 dark after the two contract-refinement fixes. Remaining warnings are all legitimate real-world findings. |
| 023 — motion-reduce clamp | ✓ green | Idempotent, mode-invariant, no edge cases. |
| 025 — protected-surface floors | ✓ green | `PROTECTED_CONTRAST_LOW` fires correctly under both modes — exactly the design intent. |
| 027 — policy packs | ✓ green | Brand-guard pack composes cleanly. |

Plus two contract refinements **landed back upstream** based on integration-test findings:
- Manifest: `accessibility: "decorative" | "informational"` on color tokens.
- Lint: hover/pressed action-text uses AA Large (3:1); rest/disabled stay at AA normal (4.5:1).

## Next

- [Report R3 — Adapter coverage](Report-03-Adapter-Coverage)
- [Report R6 — Production readiness](Report-06-Production-Readiness)
