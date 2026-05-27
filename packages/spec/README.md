# @polymorph/spec

The Polymorph theme **contract** — the open standard at the heart of the framework. Data + rules
only; the resolver/validator engine lives in `@polymorph/core` (Spec B). **Zero runtime
dependencies.**

## What ships

| Path | What |
|---|---|
| [`manifest/semantic-vocabulary.v0.json`](./manifest/semantic-vocabulary.v0.json) | Canonical vocabulary — 68 tokens (41 required), 7 component roles. The single source of truth. |
| [`schema/theme.schema.json`](./schema/theme.schema.json) | JSON Schema 2020-12 for a full theme file (generated from the manifest). |
| [`schema/components.schema.json`](./schema/components.schema.json) | Closed component-role override shapes (generated). |
| [`schema/dtcg-types.schema.json`](./schema/dtcg-types.schema.json) | Accepted DTCG 2025.10 `$type` value shapes. |
| `dist/` (TS types) | `SemanticTokenId`, `ComponentRole`, `ThemeMode`, the neutral `ResolvedTheme`, vocabulary accessors, and versioning helpers. |

## The four token layers

Primitive (FI-specific) → **semantic / alias** (`pm.*`, the contract surface) → **component**
(optional `pm.<role>.<prop>` overrides) → **theme modes** (`light` required; `dark` /
`highContrast` optional, as parallel per-mode sets under `pm.modes.*`).

See [`docs/vocabulary.md`](./docs/vocabulary.md), the DTCG conventions, retrofit guide
([`docs/adoption-retrofit.md`](./docs/adoption-retrofit.md)), and the
[versioning policy](./docs/versioning.md).

## Usage

```ts
import { requiredTokenIds, typeOf, isSemanticTokenId, type ResolvedTheme } from "@polymorph/spec";

requiredTokenIds().length;                 // 41
typeOf("pm.radius.control");               // "dimension"
isSemanticTokenId("pm.color.text.body");   // true
```

## Develop

```bash
pnpm --filter @polymorph/spec generate     # regenerate types + schema from the manifest
pnpm --filter @polymorph/spec build
pnpm --filter @polymorph/spec typecheck    # includes compile-time *.test-d.ts checks
pnpm --filter @polymorph/spec test         # vitest: schema, components, modes, versioning, manifest consistency
```

> Edit only `manifest/semantic-vocabulary.v0.json` to change the vocabulary, then `generate`.
> `tests/manifest.test.ts` fails if the generated types/schema drift from the manifest.
