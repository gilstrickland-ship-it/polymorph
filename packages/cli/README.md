# @polymorph/cli

Command-line tooling for theme authors and CI.

| Command | Purpose |
|---|---|
| `polymorph validate` | Validate a DTCG token file against the `@polymorph/spec` JSON Schema. |
| `polymorph lint` | Run the advisory a11y linter (warn, non-blocking). |
| `polymorph resolve` | Resolve aliases + select mode → emit a flat resolved token map. |
| `polymorph transform` | Build-time transform to platform-native theme artifacts (wraps [Style Dictionary](https://styledictionary.com)). |

> Implemented in **Spec B — Core + Loaders**. The `transform` command powers post-v1 Flutter
> and native iOS/Android adapters.
