# Polymorph Wiki

Welcome. This wiki has two halves:

## 📘 Tutorials — how to use each feature

Step-by-step walkthroughs, copy-pasteable, in order from "I just installed it" to
"I'm pushing to prod". Every tutorial is verified to run in CI as part of the
`@polymorph/integration-primer` test suite against GitHub Primer's real published tokens.

| # | Tutorial | What you learn |
|---|---|---|
| [01](Tutorial-01-Install-And-Validate) | Install & validate a theme | First-touch — install, validate, lint your first theme |
| [02](Tutorial-02-Author-A-Theme) | Author a theme from scratch | `polymorph init`, edit, validate, resolve, the contract's vocabulary |
| [03](Tutorial-03-Import-Tokens) | Import tokens from Tokens Studio / Figma | Drop in an existing Tokens Studio export or Figma file |
| [04](Tutorial-04-Web-Adapter) | Wire the Web adapter into a React app | `ThemeProvider`, themed primitives, CSS-vars output |
| [05](Tutorial-05-Native-Codegen) | Generate native Dart / Swift / Kotlin source | `polymorph transform`, build-time codegen, no runtime in the app |
| [06](Tutorial-06-Remote-Loader) | Ship a theme via a CDN with signing | `RemoteManifestLoader`, SRI integrity, Ed25519, version pin, rollback |
| [07](Tutorial-07-Builder) | Build a visual theme editor | `useThemeEditor`, typed fields, `LintPanel`, `ThemeEditorRoot` |
| [08](Tutorial-08-Policy-Packs) | Add a project-local lint policy pack | `definePolicyPack`, `lintWithPolicies`, CI gating |
| [09](Tutorial-09-Reduced-Motion) | Respect prefers-reduced-motion | `applyReducedMotion`, CSS `@media` emitter |
| [10](Tutorial-10-Protected-Surfaces) | Protected-surface floors for legal copy | `disclosure` role, 7:1 contrast, font-size & line-height floors |
| [11](Tutorial-11-Migrate-And-Diff) | Migrate a theme across a contract bump | `polymorph migrate`, `polymorph diff`, CI tripwire |
| [12](Tutorial-12-Conformance-And-Parity) | Gate CI on adapter conformance | `runThemeConformance`, `checkRuntimeParity` across every adapter |

## 🧪 Integration test report — Polymorph vs. GitHub Primer

We installed [`@primer/primitives`](https://www.npmjs.com/package/@primer/primitives) — GitHub's
published, MIT-licensed design tokens — and exercised every shipped spec against the
resulting theme. Findings, real bugs discovered, and per-spec results live here.

| # | Report page | Spec coverage |
|---|---|---|
| [R1](Report-01-Build-From-Primer) | Building a theme from Primer | The FI's mapping (`build-theme.ts`) — 70-token contract, 59 mapped to Primer directly, 11 sensible defaults |
| [R2](Report-02-Lint-Findings) | Lint findings on real Primer tokens | Specs 020 (a11y) + 023 (motion-reduce) + 025 (protected) + 027 (policy packs) — 4 light + 4 dark advisory warnings, brand-guard pack example |
| [R3](Report-03-Adapter-Coverage) | Adapter coverage + 2 bugs found | Spec 016 (Web CSS) + 026 (runtime parity) — **two real bugs discovered + fixed**: typography rem→px in normalizer, Swift/Kotlin/Dart family-string escape regex |
| [R4](Report-04-Loader-Governance) | Loader governance against Primer blob | Spec 022 — SRI / signature / version pin / audit hook all green against a real published theme |
| [R5](Report-05-CLI-Authoring) | CLI authoring against Primer | Spec 028 — `diff` / `migrate` / `init` against the real Primer theme |
| [R6](Report-06-Production-Readiness) | Production-readiness checklist | What's set: `publishConfig`, `bin`, `CONTRIBUTING`, `SECURITY`, `CHANGELOG`; release-process documentation |

## 🚀 Quick start

```bash
git clone https://github.com/gilstrickland-ship-it/polymorph.git
cd polymorph
pnpm install
pnpm exec nx run-many -t build typecheck test conformance
# 23 projects green — including the real-Primer integration tests
```

Then dive into [Tutorial 01](Tutorial-01-Install-And-Validate) or browse the
[Reports](Report-01-Build-From-Primer) to see how it holds up.

## See also

- [README.md](https://github.com/gilstrickland-ship-it/polymorph#readme) — top-level overview
- [docs/](https://github.com/gilstrickland-ship-it/polymorph/tree/main/docs) — full Vitepress site (`pnpm --filter @polymorph/docs dev`)
- [CONTRIBUTING.md](https://github.com/gilstrickland-ship-it/polymorph/blob/main/CONTRIBUTING.md) — dev loop + spec workflow
- [specs/](https://github.com/gilstrickland-ship-it/polymorph/tree/main/specs) — per-cycle log (specs 001-030)
