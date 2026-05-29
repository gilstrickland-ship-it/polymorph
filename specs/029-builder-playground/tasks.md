---

description: "Task list for Spec AC — builder playground example"
---

# Tasks: Builder Playground Example

**Input**: Design documents from `specs/029-builder-playground/`.

## Phase 1: Workspace plumbing

- [x] T001 `examples/builder-playground/package.json` — workspace deps on `@polymorph/{adapter-web,builder,core,spec}` + `@polymorph/example-mock-bank-aurora` (for theme JSON), peer-react 18, dev deps for `@testing-library/{react,dom}`, happy-dom, vitest.
- [x] T002 `examples/builder-playground/tsconfig.typecheck.json` — extends repo base, `jsx: "react-jsx"`, lib + types matching other React examples.
- [x] T003 `examples/builder-playground/vitest.config.ts` — `environment: "happy-dom"`, `globals: true` for RTL cleanup, `esbuild.jsx: "automatic"` because the example doesn't ship a `tsconfig.json` for vitest's esbuild to pick up.

## Phase 2: Components (FR-001 / FR-002 / FR-003)

- [x] T004 `examples/builder-playground/src/Showcase.tsx` — small composition using only `@polymorph/adapter-web` themed primitives (Stack / Card / ThemedText / Field / StepIndicator / PrimaryButton).
- [x] T005 `examples/builder-playground/src/Playground.tsx` — `ThemeEditorRoot` wired with the Aurora theme + trimmed `tokenIds` list + `renderPreview` slot mounting `<ThemeProvider>` with `resolveTheme(theme, mode)` + the showcase wrapped in `data-pm-example="playground-preview"`.
- [x] T006 `examples/builder-playground/src/index.ts` — barrel exports.

## Phase 3: Integration test (FR-004 / SC-001)

- [x] T007 `examples/builder-playground/tests/integration.test.tsx` — 5 tests: toolbar + preview mount, showcase headline in preview, every exposed token id rendered as a row, edit dirties + changes data attribute, mode switch propagates.

## Phase 4: Docs

- [x] T008 `docs/guide/builder.md` — add a "Worked example" subsection cross-linking the new example + describing what its integration test asserts.
- [x] T009 `docs/reference/packages.md` — add `examples/builder-playground` row under Examples.

## Phase 5: Verification

- [x] T010 `pnpm --filter @polymorph/example-builder-playground test` — 5/5 pass.
- [x] T011 `pnpm --filter @polymorph/docs run build` — site rebuilds, no broken links.
- [x] T012 Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **22 projects** (was 21; +1 new example).

## Notes

- Matches the existing example pattern (workspace package + vitest + typecheck), not a
  Vite SPA. Lower maintenance burden, integration asserted programmatically.
- Uses the Web adapter's themed primitives because the React Native reference SDK
  doesn't render in DOM tests.
- Direct path import of the Aurora theme JSON beats adding a package export for the
  playground only — the example is monorepo-internal so the relative path is stable.
- `esbuild.jsx: "automatic"` pin is necessary because the example doesn't ship a
  `tsconfig.json` for vitest's esbuild to pick up — documented inline in the config.
- Removed an early `queueMicrotask(() => setActiveMode(mode))` pattern in
  `renderPreview` that triggered React `act()` warnings; the editor manages its own
  mode internally and the playground simply consumes `mode` inside `renderPreview`.
