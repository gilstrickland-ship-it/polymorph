# Quickstart: Core + Loaders

## Validate

```ts
import { validateTheme } from "@polymorph/core";
const result = validateTheme(themeJson);
if (!result.valid) for (const e of result.errors) console.error(`${e.code} ${e.tokenId ?? e.path}: ${e.message}`);
```

## Resolve for a mode

```ts
import { resolveTheme } from "@polymorph/core";
const rt = resolveTheme(themeJson, "dark");
rt.tokens["pm.color.surface.base"].value;        // concrete value, no aliases
rt.components["button.primary"]?.radius;          // override or defaultsFrom value
```

## Advisory lint

```ts
import { resolveTheme, lintTheme } from "@polymorph/core";
for (const w of lintTheme(resolveTheme(themeJson))) console.warn(`${w.code}: ${w.message} (measured ${w.measured}, threshold ${w.threshold})`);
// lint never throws and never affects validity
```

## Load via any loader (same result)

```ts
import { InlineLoader, RemoteManifestLoader, BundledLoader } from "@polymorph/loaders";

const a = await new InlineLoader(themeJson).load();
const b = await new RemoteManifestLoader({ url: "https://fi.example/theme.tokens.json" }).load();
const c = await new BundledLoader(themeJson).load();

a.resolve("light"); // deep-equal to b.resolve("light") and c.resolve("light")
a.modes;            // ["light","dark", ...]
```

## CLI

```bash
polymorph validate ./aurora.tokens.json          # exit 1 + located errors if invalid
polymorph lint ./aurora.tokens.json              # advisory warnings, exit 0 (use --strict to fail)
polymorph resolve ./aurora.tokens.json --mode dark   # prints ResolvedTheme JSON
```

## Verification (maps to Success Criteria)

- **SC-001**: `pnpm --filter @polymorph/core test` — all Spec A valid fixtures valid; invalids
  invalid; new `dangling-alias` and `cycle` fixtures fail in core.
- **SC-002**: resolve `light-dark` per mode — required tokens concrete, mode-sensitive differ,
  mode-invariant identical, component fallback correct.
- **SC-003**: low-contrast fixture → advisory warning; validation still passes.
- **SC-004**: `pnpm --filter @polymorph/loaders test` — Inline/Remote(mock)/Bundled deep-equal.
- **SC-005**: `pnpm --filter @polymorph/cli test` — exit codes; `resolve` prints valid JSON.

```bash
SPECIFY_FEATURE=002-core-loaders pnpm -r --filter "@polymorph/core" --filter "@polymorph/loaders" --filter "@polymorph/cli" run build
pnpm --filter @polymorph/core --filter @polymorph/loaders --filter @polymorph/cli run test
```
