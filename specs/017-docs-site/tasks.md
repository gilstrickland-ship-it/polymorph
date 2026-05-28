---

description: "Task list for Spec Q — Vitepress docs site"
---

# Tasks: Docs Site

**Input**: Design documents from `specs/017-docs-site/`.

## Phase 1: Setup

- [x] T001 Add `docs` to `pnpm-workspace.yaml` so pnpm + Nx discover the package.
- [x] T002 `docs/package.json`: `@polymorph/docs`, private, scripts `build` / `dev` / `preview`; devDeps `vitepress@1.6.4`, `vue@3.5.13`.
- [x] T003 `docs/.vitepress/config.ts`: site title/description, navbar (Guide / Platforms / Adoption / Reference + dropdown links to specs + constitution on GitHub), per-section sidebar, `socialLinks` to GitHub, local search, edit-on-GitHub link.
- [x] T004 `.gitignore`: add `docs/.vitepress/cache/` and `docs/.vitepress/dist/`.

## Phase 2: Concept pages (US1, P1)

- [x] T005 `docs/index.md` — landing (hero + features); thesis call-out linking to vendor guide + quickstart.
- [x] T006 `docs/guide/introduction.md` — the problem (NMP integrations), the thesis, the four-layer contract, hybrid rendering, platform coverage matrix, advisory a11y posture.
- [x] T007 `docs/guide/quickstart.md` — clone + install + validate + lint + resolve + transform (one example per native target) + full workspace command.
- [x] T008 `docs/guide/semantic-vocabulary.md` — namespace, groups, required vs. optional, component-token shape, versioning rules.
- [x] T009 `docs/guide/modes-and-component-tokens.md` — DTCG-extended `modes` shape, `defaultsFrom`, what reaches adapters.
- [x] T010 `docs/guide/loaders.md` — Inline / RemoteManifest / Bundled with example each, picking table.
- [x] T011 `docs/guide/advisory-lint.md` — what's checked, behaviour, why advisory, what's *not* covered.

## Phase 3: Platform quickstarts (US1)

- [x] T012 `docs/platforms/web.md` — framework-agnostic core, naming convention, framework binding pointers.
- [x] T013 `docs/platforms/web-react.md` — built-in React binding (provider + hooks + slots + themed primitives).
- [x] T014 `docs/platforms/web-vue.md` — Vue 3 binding (composables + render-function components).
- [x] T015 `docs/platforms/web-solid.md` — Solid 1.x binding (with the zero-arg-prop footgun call-out).
- [x] T016 `docs/platforms/web-angular.md` — Angular 18+ binding (standalone components + signals + the two Angular-specific traps).
- [x] T017 `docs/platforms/react-native.md` — full runtime adapter shape (hooks, primitives, retrofit shim, slots + mapping).
- [x] T018 `docs/platforms/flutter.md` — Dart codegen quickstart, generated class shape, type mapping table, goldens & drift guard.
- [x] T019 `docs/platforms/swift.md` — Swift codegen quickstart, `PolymorphTextStyle` application, type mapping, UIKit bridging, goldens.
- [x] T020 `docs/platforms/kotlin.md` — Kotlin/Compose codegen quickstart, `PolymorphTextStyle` bridging, type mapping, view-system bridging, goldens.

## Phase 4: Adoption guides (US1/US2)

- [x] T021 `docs/guides/vendor.md` — rule one (target the contract), themed components + slots + mapping pattern, testing the contract boundary, distributing to FIs, versioning, platform coverage matrix.
- [x] T022 `docs/guides/fi.md` — what to author, validating, three authoring paths, modes strategy, delivery (link to loaders), versioning, what FIs don't own.
- [x] T023 `docs/guides/tokens-studio.md` — single-file + multi-file importer usage, type mapping, when to skip the importer.

## Phase 5: Reference (US1)

- [x] T024 `docs/reference/cli.md` — usage string, exit codes, every command + every flag + in-process API pointer.
- [x] T025 `docs/reference/contract.md` — top-level file shape, `contractVersion`, `tokens`, `components`, DTCG types, modes shape, `ResolvedTheme`, versioning rules.
- [x] T026 `docs/reference/packages.md` — table of all 19 packages by section (contract+runtime, web adapters, native adapters, quality, authoring, examples, docs).

## Phase 6: Polish + verification

- [x] T027 Root `README.md`: update status to 19 projects, mention docs site + `pnpm --filter @polymorph/docs dev`, add the native triad adapters and Angular binding to the shipped list.
- [x] T028 `pnpm --filter @polymorph/docs run build` exits 0; Vitepress reports no broken internal links.
- [x] T029 Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **19 projects**.

## Notes

- Vitepress treats markdown as Vue templates, so prose-level `{{ ... }}` collides with Vue
  interpolation. Code fences are safe; we avoid the pattern in prose (one inline mention had
  to be rephrased).
- Per-package READMEs stay authoritative for adapter-internals (full type-mapping tables,
  golden details). The docs site is the navigable surface above them; it links to GitHub for
  the deeper material rather than duplicating.
- Hosting is a separate follow-up. The PR proves the site builds and is browsable locally; a
  GitHub Pages / Vercel deploy can layer on later without touching content.
- Pnpm warns about a missing `search-insights` peer dep (transitive to Vitepress's Algolia
  bundle). Safe — we use the local search provider; ignoring the warning is correct.
