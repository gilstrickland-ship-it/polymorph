# Contributing to Polymorph

Polymorph is built spec-by-spec through [Spec Kit](https://github.com/github/spec-kit) —
one directory per cycle under `specs/`. Each cycle's deliverable is one PR that lands a
contract change, a runtime feature, an adapter, or a developer-experience improvement.
This document explains how to participate.

## Prerequisites

- Node.js **22+** (the workspace targets Node 22 in CI)
- pnpm **10.33+** — install with `npm install -g pnpm@10.33`
- Git

## First-time setup

```bash
git clone https://github.com/gilstrickland-ship-it/polymorph.git
cd polymorph
pnpm install
pnpm exec nx run-many -t build typecheck test conformance
```

The cold run should complete green across all 22 workspace projects. If anything fails
locally but passes in CI, open an issue — environment drift is a contribution
opportunity.

## Project layout

See [`docs/reference/packages.md`](docs/reference/packages.md) for the workspace map.
Three top-level areas:

- `packages/` — the shipped surface (contract, runtime, loaders, CLI, adapters,
  conformance, parity, authoring tooling, builder)
- `examples/` — reference SDK + mock banks + builder playground (used as integration
  fixtures + visible proof of the thesis)
- `specs/` — cycle log; each directory holds `spec.md` + `tasks.md` and (for some)
  `plan.md` + `research.md` + `contracts/`

## Development loop

Use Nx targets — the workspace is wired with caching, so most reruns are sub-second:

```bash
pnpm exec nx run @polymorph/<pkg>:test
pnpm exec nx run @polymorph/<pkg>:typecheck
pnpm exec nx run-many -t build typecheck test --projects=tag:scope:adapter
```

A useful one-shot before pushing: `pnpm exec nx run-many -t build typecheck test conformance`.

CI runs the same commands plus a **drift guard** that regenerates spec types/schemas,
mock-bank themes, the Tokens Studio importer fixture, and native goldens, then asserts
git is clean. If you edit the manifest or a generator, regenerate locally before pushing:

```bash
pnpm --filter @polymorph/spec generate
node examples/gen-mock-bank-themes.mjs
node tooling/authoring/scripts/gen-tokens-studio-fixture.mjs
pnpm --filter @polymorph/adapter-flutter run update-goldens
pnpm --filter @polymorph/adapter-swift run update-goldens
pnpm --filter @polymorph/adapter-kotlin run update-goldens
```

## Spec-driven workflow

Any non-trivial change starts with a spec under `specs/<NNN>-<slug>/`:

1. `spec.md` — the WHY + the contract of the change (clarifications, user stories,
   requirements, success criteria, assumptions)
2. `tasks.md` — the actionable checklist that mirrors the PR's diff

Trivial fixes (typo, regression test, lint-rule tweak) can skip the spec.

See `.specify/memory/constitution.md` for the project principles every spec must respect.

## PR shape

- One PR per spec (or per trivial fix).
- Title: `<type>(<area>): <short summary>` — e.g. `feat(core): policy packs`,
  `fix(builder): setComponentProperty resolver path`.
- Body: summary table of changes + design choices + tests + docs touched + a checklist
  proving the four commands above run green.
- Reference the spec id when applicable (`specs/030-hardening-pass/`).

## Code style

- TypeScript strict mode. No `any` unless deliberately escaping at a known boundary,
  always with a comment explaining why.
- No emojis in source or commits unless explicitly relevant to the surface (e.g. CLI
  output indicators).
- Comments explain WHY, not WHAT — well-named identifiers do the latter. Don't reference
  the current task or PR in comments; PRs document themselves.
- Don't add error handling, validation, or fallbacks for scenarios that can't happen.
  Trust internal code and framework guarantees.

## Tests

Every PR adds or updates tests. The bar:

- Unit tests for new functions / hooks / classes.
- Integration tests when crossing package boundaries.
- Conformance assertions (`runThemeConformance`, `assertConforms`) for anything that
  produces a `ResolvedTheme`.
- Cross-adapter parity (`assertRuntimeParity`) when changing a transform that runs on
  more than one target.

CI runs `nx run-many -t conformance` separately from `test`; both must pass.

## Adding a token or component role

The semantic vocabulary lives in `packages/spec/manifest/semantic-vocabulary.v0.json`.
Procedure:

1. Edit the manifest.
2. `pnpm --filter @polymorph/spec generate` — regenerates types / schemas / fixtures.
3. If the new token is required, update bank generators (`examples/gen-mock-bank-themes.mjs`)
   + any hand-authored core fixtures (`packages/core/tests/fixtures/`).
4. Re-run native goldens (the three `update-goldens` scripts above).
5. Add lint coverage if the new token has accessibility implications.
6. Open a spec under `specs/`.

## Reporting bugs

GitHub Issues. Include:

- Polymorph version (`pnpm list @polymorph/core`).
- Node / pnpm version.
- A minimum-reproducing theme JSON when applicable.
- Expected vs. actual behaviour.

## Security

See [SECURITY.md](SECURITY.md). Don't open public issues for vulnerabilities — use the
private disclosure path documented there.

## License

By contributing you agree your contributions are licensed under [Apache-2.0](LICENSE).
