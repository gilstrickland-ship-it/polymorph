# Tutorial 09 — Respect prefers-reduced-motion

**Time**: ~5 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate).

OS-level "Reduce Motion" is binary. The contract carries two reduced-motion tokens; a
single transform applies them; the Web adapter emits a `@media` block automatically so
you get the right behaviour on the web with no JS.

---

## The two tokens

| Token | Required | Purpose |
|---|---|---|
| `pm.motion.duration.reduced` | **yes** | The clamp value. Every motion duration collapses to this when reduce-motion is on. |
| `pm.motion.easing.reduced` | no | The clamp easing. Defaults to `[0, 0, 1, 1]` (linear) if absent. |

A typical bank picks `1ms` as the reduced duration (effectively instant, but not literally
zero so transitions still fire CSS callbacks).

## Web: zero-JS path

```ts
import { toCssVariablesString } from "@polymorph/adapter-web";
import { resolveTheme } from "@polymorph/core";

const css = toCssVariablesString(resolveTheme(theme, "light"));
// Output:
//
// :root {
//   --pm-motion-duration-short: 120ms;
//   --pm-motion-duration-base: 220ms;
//   …
// }
// @media (prefers-reduced-motion: reduce) {
//   :root {
//     --pm-motion-duration-short: 1ms;
//     --pm-motion-duration-base: 1ms;
//     --pm-motion-duration-long: 1ms;
//     --pm-motion-easing-standard: cubic-bezier(0, 0, 1, 1);
//   }
// }
```

The browser applies the media query — no JS required.

## Native runtimes (iOS / Android / Flutter)

Native runtimes already know about the OS preference. The host reads it, runs the
transform, hands the result to the codegen:

```ts
import { applyReducedMotion, resolveTheme } from "@polymorph/core";

const resolved = resolveTheme(theme, "light");
const reducedMotion = userPrefersReducedMotion(); // your platform query

const final = reducedMotion ? applyReducedMotion(resolved) : resolved;

// Then pass `final.tokens["pm.motion.duration.base"].value.value` to your animation API.
```

Same transform, different glue. Codegens emit one set of constants because there's no
universal "media query" primitive across iOS / Android / Flutter.

## What `applyReducedMotion` actually does

- Every token with id starting `pm.motion.duration.` → `pm.motion.duration.reduced`
- Every token with id starting `pm.motion.easing.` → `pm.motion.easing.reduced` (or linear)
- Every **component property** whose value structurally matches a duration / cubicBezier — same

It's pure, idempotent, non-mutating. Returns the input unchanged if
`pm.motion.duration.reduced` is missing.

## Opt out of the CSS @media block

```ts
toCssVariablesString(resolved, ":root", { reducedMotion: "off" });
// No @media block — useful if you apply the clamp in JS via applyReducedMotion
```

## Lint rule

`MOTION_REDUCED_EXCEEDS_SHORT` warns if `pm.motion.duration.reduced` is longer than
`pm.motion.duration.short`. The clamp is meant to be the fastest available motion;
longer than `short` means it actually slows things down — backward.

## Real-world verification

The Primer integration test exercises this:

```ts
// tests/integration-primer/tests/01-lint-and-protected.test.ts (excerpt)
const rt = resolveTheme(theme, "light");
const reducedValue = (rt.tokens["pm.motion.duration.reduced"]?.value).value;
const clamped = applyReducedMotion(rt);

for (const id of ["pm.motion.duration.short", "pm.motion.duration.base", "pm.motion.duration.long"]) {
  expect(clamped.tokens[id]?.value.value).toBe(reducedValue);
}
```

## What's next

- [Tutorial 04 — Web adapter](Tutorial-04-Web-Adapter) for the CSS-vars context
- [Tutorial 10 — Protected surfaces](Tutorial-10-Protected-Surfaces) — another floor the contract enforces
