# Security Policy

## Supported versions

Polymorph is pre-1.0. Until a `1.0.0` release, only the latest published version of each
package receives security fixes.

| Package family | Supported |
|---|---|
| Latest tagged release on each `@polymorph/*` package | ✅ |
| Anything older | ❌ |

## Reporting a vulnerability

**Please do not open public GitHub issues for security vulnerabilities.** Use one of the
private disclosure paths instead:

1. **Preferred — GitHub Private Vulnerability Reporting**: open a private advisory at
   <https://github.com/gilstrickland-ship-it/polymorph/security/advisories/new>. This is
   end-to-end private until we publish the advisory.
2. **Alternative — Email**: send to the address listed in the repo's GitHub profile.
   Subject line `[polymorph-security]` so it routes correctly.

Include:

- A description of the vulnerability and its impact.
- A minimum reproducer (theme JSON, code snippet, or steps).
- The affected `@polymorph/*` package(s) and version(s).
- Your name / handle for credit (optional).

## What to expect

| Stage | Target |
|---|---|
| Acknowledgement of the report | within 3 business days |
| Initial assessment | within 7 business days |
| Patch release (for confirmed high/critical) | within 30 days |
| Public disclosure + advisory | coordinated with the reporter |

## Scope

In scope:

- Any `@polymorph/*` package shipped on npm.
- The `polymorph` CLI binary.
- The CSS / Dart / Swift / Kotlin source code emitted by the adapters.
- The drift guard + conformance + parity infrastructure.

Out of scope (open a regular issue instead):

- Issues in third-party tooling we depend on (Ajv, satori, resvg, react, etc.) — please
  report those upstream.
- Issues in FI-supplied themes or policy packs — those are governed by the host's own
  security process.
- Theoretical risks that require host code to misuse the API (e.g. an FI that disables
  signature verification on a `RemoteManifestLoader`).

## Hardened defaults

The contract and runtime ship with several opt-in but **production-recommended** hardening
features. We treat regressions in these as in-scope vulnerabilities:

- `RemoteManifestLoader` — SRI integrity, Ed25519 signature verification, version pinning,
  fail-closed rollback, ETag-conditional refresh, audit hook. See
  `docs/guide/loader-governance.md`.
- Advisory lint — WCAG 2.1 contrast, motion-reduce, protected-surface floors. See
  `docs/guide/advisory-lint.md` and `docs/guide/protected-surfaces.md`.
- Schema validation — every loader runs `validateTheme` before exposing a theme to the
  SDK. Bypassing validation is a runtime mis-configuration, not a contract feature.

## Disclosure history

This file will be updated with a chronological list of disclosed vulnerabilities once we
have any. Currently empty.
