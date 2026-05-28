# Loaders

Three reference loaders implement one `ThemeLoader` interface. The contract: parse + validate
+ resolve + select a mode → return a `ResolvedTheme`. The host picks how the bytes get to the
app; the rest is identical.

```ts
interface ThemeLoader {
  load(opts?: { mode?: ThemeMode }): Promise<ResolvedTheme>;
}
```

## InlineLoader

The host passes a token object at SDK init. Simplest; default for the demos.

```ts
import { InlineLoader } from "@polymorph/loaders";
import auroraTheme from "./aurora.tokens.json";

const loader = new InlineLoader(auroraTheme);
const theme = await loader.load({ mode: "light" });
```

## RemoteManifestLoader

The host points at a URL/CDN that serves the theme JSON. The loader fetches, validates, and
caches. Optional integrity check (SRI or signature) is the recommended posture for production.

```ts
import { RemoteManifestLoader } from "@polymorph/loaders";

const loader = new RemoteManifestLoader({
  url: "https://themes.bank.example.com/v1/aurora.tokens.json",
  cache: "browser",          // or "memory"
  integrity: "sha384-...",   // optional
});
const theme = await loader.load({ mode: "dark" });
```

Theme updates without an app release where the FI's policy allows it. Cache-busting, version
pinning, and signing are out of scope for the loader; the host wires their existing CDN
posture.

## BundledLoader

A build-time-compiled theme package shipped inside the app. Use when policy forbids runtime
fetch, or to amortise startup.

```ts
import { BundledLoader } from "@polymorph/loaders";
import { aurora } from "@my-bank/polymorph-theme";

const loader = new BundledLoader(aurora);
const theme = await loader.load();
```

## Choosing

| Loader | When |
|---|---|
| Inline | Demos, tests, single-tenant apps where the theme lives next to the code. |
| RemoteManifest | Multi-tenant apps; theme updates faster than the release cadence. |
| Bundled | Strict-CSP environments; theme published as a versioned package. |

All three return the same `ResolvedTheme` — adapters can't tell which loader produced it.
