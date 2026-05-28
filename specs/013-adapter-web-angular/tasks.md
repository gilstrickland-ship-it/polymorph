---

description: "Task list for Spec M — Web Adapter: Angular 18+ binding"
---

# Tasks: Web Adapter — Angular 18+ Binding

**Input**: Design documents from `specs/013-adapter-web-angular/`.

## Phase 1: Setup

- [x] T001 `packages/adapter-web-angular/package.json`: deps `@polymorph/spec`, `@polymorph/adapter-web`; optional peer `@angular/core >= 18` + `rxjs >= 7`; devDeps `@polymorph/core`, `@angular/*` (core/common/compiler/platform-browser/platform-browser-dynamic), `rxjs`, `tslib`, `zone.js@~0.14.10`, `@types/node`, `happy-dom`, `vitest`.
- [x] T002 Add `@polymorph/adapter-web-angular` path mapping in `tsconfig.base.json`.
- [x] T003 `tsconfig.json` (build, `paths:{}`, `lib + DOM`, `experimentalDecorators`, `emitDecoratorMetadata`, `useDefineForClassFields: false`), `tsconfig.typecheck.json` (same + `noEmit`/`types:["node"]`/include src+tests), `vitest.config.ts` with `environment: "happy-dom"` and `setupFiles: ["./tests/setup.ts"]`.
- [x] T004 `tests/setup.ts`: load `zone.js` + `zone.js/testing`, initialise `TestBed` with `BrowserDynamicTestingModule` + `platformBrowserDynamicTesting()`.

## Phase 2: DI + provider (US1, P1)

- [x] T005 `src/types.ts`: `SlotComponents`/`ComponentRegistry` using Angular's `Type<unknown>`; `ThemeStore = WritableSignal<ThemeContextValue | null>`.
- [x] T006 `src/context.ts`: `THEME_TOKEN: InjectionToken<ThemeStore>`.
- [x] T007 `src/provider.ts`: standalone `ThemeProviderComponent` with component-scoped `providers` registering a fresh `signal(null)` per instance. Imperative `Renderer2.createElement("style")` + `insertBefore` for the scoped `<style>` block (template `<style>` is stripped by Angular's compiler). `ngOnChanges` writes the signal.

## Phase 3: Composables + primitives (US2 / US3)

- [x] T008 `src/composables.ts`: `injectTheme` / `injectThemeBridge` / `injectResolvedTheme` / `injectSlot` / `injectThemedComponent`, all throwing outside the provider.
- [x] T009 `src/primitives.ts`: `ThemedTextComponent` (always `<span>` — variant drives typography token) and `PrimaryButtonComponent` (emits `press`). Standalone.

## Phase 4: Tests

- [x] T010 `tests/provider.test.ts` (4): DI flow (probes capture in `ngOnInit`, not the constructor), `<style>` element content, slot override resolution, helper throws outside provider.
- [x] T011 `tests/primitives.test.ts` (3): `ThemedText` renders span with the right styles; muted variant; `PrimaryButton` press + disabled.

## Phase 5: Polish

- [x] T012 `src/index.ts` barrel (Angular-specific surface + framework-agnostic core re-exports).
- [x] T013 `README.md` (covers the two Angular-specific traps — capture-in-`ngOnInit` and template-`<style>`-stripping) and `specs/013-adapter-web-angular/{spec,tasks}.md`.
- [x] T014 Cold-state full workspace `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **15 projects**.

## Notes

- No `NgModule` — every component is standalone (Angular 14+; default in 18+).
- Template `<style>` blocks are extracted into the component's styles array by Angular's compiler;
  for a per-instance scoped stylesheet we create the element via `Renderer2` instead.
- Probes / consumers that need a snapshot of the context should call `injectTheme()()` in
  `ngOnInit`, not in the constructor — provider's `ngOnChanges` hasn't run yet at construction.
- `ThemedText` renders `<span>` regardless of variant — multiple variant-conditional `<ng-content>`
  slots all sharing the default slot is unsupported in Angular's projection model. Users wrap
  with their own semantic element where it matters.
