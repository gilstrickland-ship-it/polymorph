# Reduced motion

The contract carries two reduced-motion tokens:

| Token | Required | Purpose |
|---|---|---|
| `pm.motion.duration.reduced` | yes | The clamp value. When `prefers-reduced-motion: reduce` is on, every motion duration in the resolved theme collapses to this. |
| `pm.motion.easing.reduced` | no | The clamp easing. Defaults to linear (`[0, 0, 1, 1]`) when absent. |

The shape is "one clamp value for everything" rather than "per-token reduced companions"
because that's what OS-level reduced-motion settings actually express — a binary "tone it
down", not a fine-grained per-animation override.

## How the clamp is applied

`@polymorph/core` exposes a pure transform:

```ts
import { applyReducedMotion, resolveTheme } from "@polymorph/core";

const resolved = resolveTheme(aurora, "light");

// When the host detects prefers-reduced-motion: reduce
const clamped = applyReducedMotion(resolved);
```

`applyReducedMotion` returns a new `ResolvedTheme` with:

- Every `pm.motion.duration.*` token replaced by the value at `pm.motion.duration.reduced`.
- Every `pm.motion.easing.*` token replaced by the value at `pm.motion.easing.reduced`
  (or `[0, 0, 1, 1]` if absent).
- Every component property whose value structurally matches a duration / cubicBezier
  swapped to the same.

The transform is **idempotent** and **non-mutating**. It returns the input unchanged when
`pm.motion.duration.reduced` is missing — schema validation catches that elsewhere; the
transform is intentionally loose so it's safe to call on partial themes during development.

## Web adapter: CSS `@media` block

The Web adapter's `toCssVariablesString` emits a sibling `@media (prefers-reduced-motion:
reduce)` block by default. It contains **only the variables that differ under the clamp** —
motion durations + easings — so the cascade stays minimal:

```css
:root {
  --pm-motion-duration-short: 120ms;
  --pm-motion-duration-base: 220ms;
  /* … all other variables … */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --pm-motion-duration-short: 1ms;
    --pm-motion-duration-base: 1ms;
    --pm-motion-duration-long: 1ms;
    --pm-motion-easing-standard: cubic-bezier(0, 0, 1, 1);
    --pm-motion-easing-emphasized: cubic-bezier(0, 0, 1, 1);
  }
}
```

Opt out when you apply the clamp in JS:

```ts
toCssVariablesString(resolved, ":root", { reducedMotion: "off" });
```

Render just the media block separately:

```ts
import { toReducedMotionMediaBlock } from "@polymorph/adapter-web";
const block = toReducedMotionMediaBlock(resolved, ".aurora");
```

## Native adapters

Native runtimes already know about the OS preference (`UIAccessibility.isReduceMotionEnabled`
on iOS, `Settings.Global.ANIMATOR_DURATION_SCALE` on Android, `MediaQuery.disableAnimations`
on Flutter). The host reads the flag, calls `applyReducedMotion` on the resolved theme
before passing it to the adapter codegen, and re-renders when the preference flips.

Codegens emit a single set of constants (the post-clamp values). They don't try to ship
both versions and switch at runtime because the toolchains don't have a uniform
preference-query primitive.

## Lint rule

`MOTION_REDUCED_EXCEEDS_SHORT` warns when `pm.motion.duration.reduced` is *longer* than
`pm.motion.duration.short`. The reduced clamp is meant to be the fastest available motion;
authoring it longer than `short` means the clamp actually slows micro-interactions when
reduced-motion is on — exactly backward. Advisory; the user reviews intent.

## What this doesn't ship

- **A runtime preference listener.** Adapter codegens are pure (no DOM / no platform calls).
  The host wires the preference query and calls `applyReducedMotion` on change. The Web
  CSS @media block IS the runtime listener — when shipping the CSS-vars path, hosts don't
  need any JS at all.
- **Per-component reduced-motion overrides.** The contract carries one clamp; per-component
  tuning belongs in product code, not the design system.
- **Animation cancellation.** The clamp shortens durations but doesn't cancel in-flight
  animations. That's the host's choice — most apps that respect reduced motion simply let
  the existing animation finish at full speed and apply the clamp on the next one.
