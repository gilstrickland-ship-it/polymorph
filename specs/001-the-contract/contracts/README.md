# Contracts — Spec A (The Contract)

The consumable artifacts that define the Polymorph theme contract. These are realized in the
`@polymorph/spec` package during `/speckit-implement`.

| Artifact | What it fixes | Realized as |
|---|---|---|
| [`semantic-vocabulary.v0.json`](./semantic-vocabulary.v0.json) | The canonical token vocabulary (ids, `$type`, required, modeSensitive) + closed component-role set. **The heart of the contract.** | `packages/spec/manifest/semantic-vocabulary.v0.json` |
| [`dtcg-extensions.md`](./dtcg-extensions.md) | The three conventions over DTCG 2025.10: `pm` namespace, per-mode token sets, optional component layer. | encoded in `packages/spec/schema/theme.schema.json` + docs |
| [`resolved-theme.contract.md`](./resolved-theme.contract.md) | The neutral `ResolvedTheme` output shape SDKs/adapters consume. | `packages/spec/src/types.ts` |

Not present here (by design): the JSON Schema file and TS types are **generated/derived** from
the manifest during implementation (research R7), and the executing validator lives in
`@polymorph/core` (Spec B), not in `@polymorph/spec`.

Consistency rule: the manifest is the single source of truth. Schema required-assertions and TS
ids/`ResolvedTheme` are checked against it by `packages/spec/tests/manifest.test.ts`.
