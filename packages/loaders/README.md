# @polymorph/loaders

Pluggable theme **delivery** behind a single `ThemeLoader` interface. Three reference
implementations, all returning a validated, resolved theme:

- **InlineLoader** — host passes a token object at SDK init (primary, simplest).
- **RemoteManifestLoader** — fetch a *versioned* token JSON from an FI-controlled URL/CDN; cache + validate (+ optional signature/integrity check). Enables theme updates without an app release.
- **BundledLoader** — build-time-compiled theme package bundled into the app.

> Implemented in **Spec B — Core + Loaders**.
