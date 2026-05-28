# Feature Specification: Docs Site

**Spec ID**: 017-docs-site

**Created**: 2026-05-28

**Status**: Implemented

**Input**: The repo has 19 packages with per-package READMEs but no central landing surface
for vendors and FIs to discover Polymorph, get oriented, and find the right adapter / guide.
This spec adds a Vitepress site under `docs/` with concept pages, platform quickstarts,
adoption guides, and reference — wired as a workspace project so its build is verified on
every PR.

---

## Overview

`@polymorph/docs` is a Vitepress 1.6 site rooted at `docs/`. It joins the pnpm workspace
(matched by a new `docs` entry in `pnpm-workspace.yaml`), picks up an Nx-discoverable `build`
script, and lives alongside the other 18 packages without a TypeScript build (the content is
markdown; Vitepress handles its own pipeline).

The information architecture is four sections:

1. **Guide** — concepts: introduction, quickstart, the semantic vocabulary, modes & component
   tokens, loaders, advisory lint.
2. **Platforms** — per-adapter quickstart: web (core + React/Vue/Solid/Angular bindings) and
   mobile (React Native + Flutter / Swift / Kotlin codegen).
3. **Adoption** — the two headline guides: vendor (SDK author) integration and FI theme
   authoring; plus Tokens Studio import.
4. **Reference** — CLI, contract reference (pointer to the manifest as source of truth),
   workspace package map.

---

## Clarifications

### Session 2026-05-28

- Q: Vitepress or Astro Starlight? → A: **Vitepress** — Vite-based (matches the workspace's
  toolchain), markdown-first, lightweight, no JSX/React runtime layer needed for a
  reference-style site. Starlight's component story is unused here.
- Q: One site for everything, or per-package docs sites? → A: **One site.** Per-package
  READMEs already exist and stay as the authoritative source for adapter-specific details
  (type mappings, etc.). The site links to GitHub for those rather than duplicating.
- Q: Hosted where? → A: **Out of scope for this spec.** The site builds to static HTML
  (`docs/.vitepress/dist`); deployment (GitHub Pages, Vercel, custom domain) is a follow-up.
  The PR proves the site builds; hosting decision comes later.
- Q: How to handle the markdown `{{ ... }}` collision with Vue interpolation? → A: Inline
  `style={{ ... }}` patterns in prose (outside code fences) confuse Vue's compiler. We avoid
  them in prose; fenced code blocks (`\`\`\`tsx` / `\`\`\`kotlin` / etc.) work as expected.
- Q: Search? → A: **Local provider** (`search: { provider: "local" }`) — no Algolia
  DocSearch setup needed for v1. Easy to swap later.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A vendor evaluates Polymorph (Priority: P1)

A banking-platform vendor lands on the docs site, reads
[`/guide/introduction`](../../docs/guide/introduction.md) for the thesis, follows
[`/guide/quickstart`](../../docs/guide/quickstart.md) to run the workspace, scans
[`/platforms/web`](../../docs/platforms/web.md) (or RN / Flutter / Swift / Kotlin) for their
target, and ends at
[`/guides/vendor`](../../docs/guides/vendor.md) for the integration shape.

**Independent Test**: `pnpm --filter @polymorph/docs run build` exits 0 (Vitepress builds the
static bundle); every internal link resolves (Vitepress reports broken links during build).

### User Story 2 — An FI's design team authors a theme (Priority: P1)

An FI lands on [`/guides/fi`](../../docs/guides/fi.md), follows the authoring path, references
[`/guide/semantic-vocabulary`](../../docs/guide/semantic-vocabulary.md) for what tokens to
fill in, picks a [loader](../../docs/guide/loaders.md), and validates locally.

**Independent Test**: Same build smoke test; manual review of the FI guide content.

### User Story 3 — CI smoke-tests the site (Priority: P2)

Nx auto-discovers `@polymorph/docs` from its `package.json` scripts; `nx run-many -t build`
includes the site. Markdown typos / broken Vue parsing fail the build like any other workspace
project.

### Edge Cases

- **Vue interpolation collision**: Vitepress treats markdown content as Vue templates;
  prose-level `{{ ... }}` triggers the compiler. We sidestep by avoiding double-brace literals
  outside code fences.
- **Empty `public/` directory**: Vitepress doesn't require it; if present and empty, git
  doesn't track it. We don't ship one.
- **Vitepress's optional `search-insights` peer**: `pnpm install` emits a warning for the
  Algolia peer we don't use. Safe to ignore; the local search provider doesn't need it.

---

## Requirements *(mandatory)*

- **FR-001**: A `docs/` directory MUST contain a `package.json` declaring `@polymorph/docs`
  with `build` / `dev` / `preview` scripts that call Vitepress.
- **FR-002**: `pnpm-workspace.yaml` MUST include `docs` so pnpm + Nx discover the project.
- **FR-003**: The Vitepress config (`docs/.vitepress/config.ts`) MUST declare a navbar and
  per-section sidebar covering: Guide, Platforms, Adoption, Reference.
- **FR-004**: The site MUST cover at minimum: introduction, quickstart, semantic vocabulary,
  modes & component tokens, loaders, advisory lint, one page per shipped adapter, vendor
  guide, FI guide, Tokens Studio import guide, CLI reference, contract reference, workspace
  package list.
- **FR-005**: `pnpm --filter @polymorph/docs run build` MUST exit 0 with no broken-link
  warnings.
- **FR-006**: Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache`
  MUST pass across the new project count (**19**).
- **FR-007**: Vitepress build output (`docs/.vitepress/dist/`, `docs/.vitepress/cache/`) MUST
  be `.gitignore`d.

---

## Success Criteria *(mandatory)*

- **SC-001**: `pnpm --filter @polymorph/docs run build` produces a static bundle.
- **SC-002**: `pnpm exec nx run-many -t build typecheck test conformance --skip-nx-cache`
  green across **19 projects**.
- **SC-003**: Root README mentions the docs site; project count updated to 19.

---

## Assumptions

- Hosting (GitHub Pages, Vercel, custom domain) is a separate follow-up. v1 proves the site
  builds and is browsable locally via `pnpm --filter @polymorph/docs dev`.
- Per-package READMEs remain authoritative for adapter-specific deep dives (type mapping
  tables, golden semantics); the docs site provides the navigable surface above them and
  links to GitHub for the gritty details.
- Content evolves spec-by-spec — each future adapter / authoring path / a11y change updates
  the relevant docs page in the same PR.
- The `search-insights` pnpm warning is benign; we use the local search provider.
