# @polymorph/core

The runtime **resolution core** (TypeScript) shared by web and React Native adapters.

Pipeline: parse → **validate** against the `@polymorph/spec` JSON Schema → **advisory a11y
lint** (warn, non-blocking; host owns final compliance) → **resolve aliases** → **select theme
mode** → emit a **flat resolved token map** handed to a platform adapter.

> Implemented in **Spec B — Core + Loaders**.
