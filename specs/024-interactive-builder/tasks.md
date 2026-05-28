---

description: "Task list for Spec X — interactive theme builder"
---

# Tasks: Interactive Theme Builder

**Input**: Design documents from `specs/024-interactive-builder/`.

## Phase 1: New package scaffold

- [x] T001 `packages/builder/package.json`: name `@polymorph/builder`, deps on `@polymorph/{spec,core,adapter-web}` (workspace), peerDep React 18+, dev deps on `@testing-library/react` (+ `@testing-library/dom`), happy-dom, react / react-dom 18.3, vitest.
- [x] T002 `packages/builder/{tsconfig.json,tsconfig.typecheck.json,vitest.config.ts}`. Note: vitest `globals: true` so React Testing Library's auto-cleanup registers (documented in the config).
- [x] T003 `tsconfig.base.json`: add `@polymorph/builder` path alias.

## Phase 2: Headless hook (FR-001 — FR-005)

- [x] T004 `src/use-theme-editor.ts`: `useThemeEditor(initial, mode?)` returns `{state, actions...}`. `state` carries `baseline`, `working`, `mode`, `dirty`, `changedTokenIds`, `validation`, `warnings`.
- [x] T005 `setTokenValue` writes mode-sensitive ids under `pm.modes.<mode>` and mode-invariant ids under `pm.*` — detected by probing baseline structure (avoids importing TOKENS metadata in the hook surface).
- [x] T006 `setComponentProperty`, `setMode`, `reset`, `commit`, `loadTheme`, `exportTheme`.
- [x] T007 `dirty` derives from `changedTokenIds.size > 0`. `changedTokenIds` is computed by walking the working theme and deep-comparing each authored token node against baseline.
- [x] T008 Internal `walk(node, path, visit)` accepts the starting path; called with `[]` (not `["pm"]`) so the recursive accumulator doesn't duplicate the `pm` segment.

## Phase 3: Typed fields (FR-006)

- [x] T009 `src/fields/types.ts`: shared `FieldProps<T>` shape.
- [x] T010 `src/fields/color-field.tsx`: pairs `<input type="color">` + `<input type="text">`. `aria-invalid` on the text input when the hex doesn't match.
- [x] T011 `src/fields/dimension-field.tsx`: number input + closed unit dropdown (`px` / `rem` / `em` / `%`).
- [x] T012 `src/fields/duration-field.tsx`: number input + `ms` / `s` dropdown.
- [x] T013 `src/fields/number-field.tsx`: number input with optional `min` / `max` / `step` for ranged token families.
- [x] T014 `src/fields/cubic-bezier-field.tsx`: four number inputs as a `role="group"`. `x1` / `x2` clamped to `[0, 1]`.
- [x] T015 `src/fields/token-field.tsx`: dispatcher on `$type` — returns the right primitive or `null` for `typography` / `shadow`.

## Phase 4: Lint panel + orchestrator (FR-007 / FR-008 / FR-009)

- [x] T016 `src/lint-panel.tsx`: accessible `<ul role="list" aria-live="polite">`, one `<li>` per warning with `data-pm-lint-code`, `data-pm-highlighted-token` when matching `highlightedTokenId`, button-row with `onActivate`.
- [x] T017 `src/theme-editor-root.tsx`: orchestrator — toolbar (mode dropdown + dirty indicator + Reset / Save buttons) + token list (rendered via `TokenField`) + lint panel + optional `renderPreview` slot.
- [x] T018 `src/index.ts`: barrel exports.

## Phase 5: Tests (SC-001 — SC-005)

- [x] T019 `tests/use-theme-editor.test.tsx` — 10 tests: starts-clean, set-token-dirties, mode-sensitive-write-path, mode-invariant-write-path, reset, commit (snapshots baseline), warnings-recompute, schema-invalid-validates, loadTheme, exportTheme-is-clone.
- [x] T020 `tests/fields.test.tsx` — 10 tests: color (renders pair + emits hex + aria-invalid), dimension (value-only / unit-only changes), duration (units), number (range), cubicBezier (group + per-slot emit), TokenField dispatcher (null for typography / dispatches color).
- [x] T021 `tests/lint-panel.test.tsx` — 5 tests: empty-state, codes-rendered, highlighting, onActivate-invocation, disabled-button-when-no-handler.
- [x] T022 `tests/theme-editor-root.test.tsx` — 6 tests: toolbar-renders, save-disabled-clean, onCommit-emits-edited-theme, preview-slot-renders, preview-reflects-mode-change, changed-row-data-attribute.

## Phase 6: Docs

- [x] T023 `docs/guide/builder.md`: new page — surface table, hook walkthrough, field reference, lint-panel pattern, orchestrator example with `ThemeProvider`, what-isn't-shipped.
- [x] T024 `docs/.vitepress/config.ts`: add to Guide sidebar.
- [x] T025 `docs/reference/packages.md`: add `@polymorph/builder` row + bump the `@polymorph/authoring` row to reflect the three importers it ships now.

## Phase 7: Verification

- [x] T026 `pnpm --filter @polymorph/builder test` — 31/31 pass.
- [x] T027 `pnpm --filter @polymorph/docs run build` — site rebuilds, no broken-link warnings.
- [x] T028 Cold-state `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **21 projects** (was 20; +1 new package).

## Notes

- Headless + composable on purpose. The hook is the primary surface; `ThemeEditorRoot` is
  the 80% case. Going hook-only is supported for sophisticated UIs (drag-drop,
  search, multi-section grouping).
- Mode-sensitive routing probes baseline structure rather than importing TOKENS so the
  builder stays independent of contract-version rebuilds (forcing consumers to reinstall
  on every spec bump would be a poor DX for an editor surface).
- Composite-type editors (typography / shadow) are out of scope — `TokenField` returns
  `null` and FIs slot in custom composite editors. Picking a font-family picker UI is out
  of scope for this contract.
- No visual chrome. Every component emits accessible unstyled markup with `data-pm-*`
  attributes; the FI styles to match their tooling. Any opinion we ship is wrong for
  someone.
- React-only for v1. Vue / Solid / Angular builders use the same `validateTheme` /
  `lintTheme` core; the FI builds the state machine around it. Happy to add if asked.
- Vitest `globals: true` is necessary, not optional, for React Testing Library cleanup.
  Without it, rendered nodes pile up in the JSDOM container across tests and lookups
  match every Save button ever rendered.
