# @polymorph/loaders

Pluggable theme **delivery** behind a single `ThemeLoader` interface. `load()` validates once and
returns a **handle** exposing `resolve(mode)` + `modes` (switch modes at runtime without
reloading).

```ts
import { InlineLoader, RemoteManifestLoader, BundledLoader } from "@polymorph/loaders";

const loaded = await new InlineLoader(themeJson).load();
loaded.modes;            // ["light","dark", ...]
loaded.resolve("dark");  // ResolvedTheme — deep-equal across all three loaders
```

- **InlineLoader** — host passes a token object at init (primary, simplest).
- **RemoteManifestLoader** — `{ url, fetch?, cacheTtlMs? }`: fetch a versioned token JSON, validate,
  and cache in memory. Typed errors: `LoaderFetchError`, `LoaderParseError`, `ThemeValidationError`.
  Signing/integrity is deferred (roadmap).
- **BundledLoader** — a build-time-compiled theme bundled into the app.

A loader never returns an invalid theme — it rejects with `ThemeValidationError` carrying the
located `ValidationError[]`.

> Implemented in **Spec B — Core + Loaders**.
