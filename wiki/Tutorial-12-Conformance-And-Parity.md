# Tutorial 12 — Gate CI on adapter conformance & cross-adapter parity

**Time**: ~10 minutes. **Prerequisites**: [Tutorial 01](Tutorial-01-Install-And-Validate), CI you control.

Two assertions you want in CI:

1. **Conformance**: does the theme satisfy the contract's invariants? (Every required
   token present, no aliases remain, all paths are `pm.*`-prefixed, component roles
   resolve.)
2. **Runtime parity**: does every adapter agree with core's resolution? (Web CSS + Dart +
   Swift + Kotlin all normalised + diffed against a baseline computed from `resolveTheme`.)

---

## Install

```bash
npm install --save-dev @polymorph/conformance @polymorph/native-parity
```

## Conformance

```ts
import { assertConforms } from "@polymorph/conformance";
import theme from "./theme.tokens.json" with { type: "json" };

assertConforms(theme, "mybank");
// Throws on failure with a readable list of failed checks.
```

What it checks:

| Check | Per |
|---|---|
| Theme passes `validateTheme` (schema + alias graph) | once |
| `declaredModes` includes `"light"` | once |
| Every required token resolves under every declared mode | each mode |
| No aliases survive resolution | each mode |
| Every token key starts with `pm.` | each mode |
| Every component role has all its properties filled (with fallbacks applied) | each mode |

A failure example:

```
mybank failed conformance:
  ✗ [light] required tokens present: missing: pm.motion.duration.reduced
  ✗ [light] no aliases remain: aliased: pm.color.surface.base
```

## Runtime parity

`assertRuntimeParity` runs the theme through every adapter and asserts each agrees with
core:

```ts
import { assertRuntimeParity } from "@polymorph/native-parity";

assertRuntimeParity(theme, "light", "mybank");
assertRuntimeParity(theme, "dark",  "mybank");
```

What's checked:

- **Web (CSS vars)** — `toCssVariables(resolved)` parses back to the same normalised
  values as `resolveTheme` produces.
- **Dart** — `transformToDart(theme, ...)` parses back to the same values, including
  component-role flat constants.
- **Swift** — same for `transformToSwift`.
- **Kotlin** — same for `transformToKotlin`.

A failure shows the divergent token name with both sides:

```
mybank[light] runtime parity failed:
  web-css: 3 mismatches
    - typographyBody: baseline={"kind":"typography","fontSizePx":16} got={"kind":"typography","fontSizePx":1}
    - typographyHeading: …
```

## Real-world value: bugs caught

The Primer integration test (which is itself a CI conformance + parity gate) caught
**two real bugs** before they shipped:

1. **`normalizeResolved` typography fontSize wasn't converting `rem` → `px`.** Adapters
   convert (multiply by 16); core baseline didn't. Discovered because Primer ships sizes
   in rem. Fixed in `packages/native-parity/src/normalize-resolved.ts`.

2. **Swift / Kotlin / Dart parsers' typography fontFamily regex didn't handle escaped
   quotes.** Primer's Mona Sans stack contains `"Segoe UI"`, `"Mona Sans VF"`, etc. The
   codegen escapes them correctly; the parser regex stopped at the first quote. Fixed in
   all three parsers.

Full transcript in [Report R3 — Adapter coverage](Report-03-Adapter-Coverage).

## The two checks compose

```yaml
# .github/workflows/theme-ci.yml
name: Theme CI
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx polymorph validate theme.tokens.json
      - run: npx polymorph lint theme.tokens.json --mode light --strict
      - run: npx polymorph lint theme.tokens.json --mode dark  --strict
      - run: node -e "import('./scripts/ci-gate.mjs')"
```

```js
// scripts/ci-gate.mjs
import { assertConforms } from "@polymorph/conformance";
import { assertRuntimeParity } from "@polymorph/native-parity";
import { readFileSync } from "node:fs";

const theme = JSON.parse(readFileSync("./theme.tokens.json", "utf8"));
assertConforms(theme, "mybank");
assertRuntimeParity(theme, "light", "mybank");
assertRuntimeParity(theme, "dark",  "mybank");
console.log("✓ theme passes conformance + parity");
```

## What's next

- [Tutorial 06 — Remote loader](Tutorial-06-Remote-Loader) for the runtime delivery side
- [Tutorial 08 — Policy packs](Tutorial-08-Policy-Packs) for FI-specific lint gates
- [Report R3 — Adapter coverage](Report-03-Adapter-Coverage) for the bugs Primer caught
