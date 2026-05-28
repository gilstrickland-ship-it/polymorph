# @polymorph/adapter-web-angular

Angular 18+ binding for `@polymorph/adapter-web`. Same surface as the React / Vue / Solid
bindings (provider + composables + slots + role mapping + retrofit shim + themed primitives) —
standalone components + signals, no NgModules.

```ts
// app.component.ts
import { Component } from "@angular/core";
import { InlineLoader } from "@polymorph/loaders";
import { ThemeProviderComponent, ThemedTextComponent, PrimaryButtonComponent } from "@polymorph/adapter-web-angular";

@Component({
  standalone: true,
  imports: [ThemeProviderComponent, ThemedTextComponent, PrimaryButtonComponent],
  template: `
    <polymorph-theme-provider [theme]="resolved">
      <polymorph-themed-text variant="heading">Open your account</polymorph-themed-text>
      <polymorph-primary-button label="Continue" (press)="next()" />
    </polymorph-theme-provider>
  `,
})
export class AppComponent {
  resolved = await (await new InlineLoader(auroraTheme).load()).resolve("light");
  next(): void {}
}
```

## Surface

| Layer | Export |
|---|---|
| Framework-agnostic core | re-exported from `@polymorph/adapter-web` (`toCssVariables`/`toCssVariablesString`/`createBridge`/`toTokenMap`) |
| DI + composables | `THEME_TOKEN`, `ThemeProviderComponent`, `injectTheme`, `injectThemeBridge`, `injectResolvedTheme`, `injectSlot`, `injectThemedComponent` |
| Themed primitives | `ThemedTextComponent`, `PrimaryButtonComponent` |

## How it works

`ThemeProviderComponent` is a standalone component with component-scoped `providers` that register
a per-instance `WritableSignal<ThemeContextValue | null>` under `THEME_TOKEN`. Descendants in the
DOM tree (content-projected children included — element-injector lookup walks the DOM) read the
signal via `inject(THEME_TOKEN)` (or the `injectTheme()` helper).

The CSS-variable `<style>` block is created imperatively via `Renderer2` rather than declared in
the template, because Angular's template compiler extracts template-level `<style>` tags into the
component's styles array and they never reach the DOM as real `<style>` elements.

`ngOnChanges` keeps the signal in sync with `@Input` changes (theme/slots/components/scope).
Composables return **accessor functions** (`() => ThemeContextValue`), so consumers can call them
inside `computed()` / `effect()` for reactivity, or once in `ngOnInit` for a snapshot.

## Two Angular-specific traps documented here

1. **Capture in `ngOnInit`, not the constructor.** When a child component is instantiated as part
   of the provider's content, its constructor runs *before* the parent's `ngOnChanges`. The
   provider's signal is still `null` at that point. `injectTheme()`'s accessor throws on a null
   signal — call it from `ngOnInit` (or lazily in a template / `computed()`) and you're past the
   race.
2. **One `<ng-content>` per template — no per-variant tag switching.** Angular's projection model
   only fills one default-slot `<ng-content>`; placing multiple per-variant `<ng-content>` inside
   `@switch`/`@case` blocks leaves the active branch's slot empty. The Angular `ThemedTextComponent`
   therefore always renders a `<span>` (the variant still drives typography + colour). Wrap in
   `<h2>`/`<small>`/etc. yourself if semantic tags matter.

## Angular versions

`@angular/core >= 18` (declared as an **optional peer** so the package doesn't auto-install
Angular in CI). Tests use `TestBed` + zone.js + happy-dom; build uses standard tsc with
`experimentalDecorators` and `emitDecoratorMetadata` (matching Angular 18's conventions).

> Implemented in **Spec M — adapter-web Angular binding**. With React (built-in), Vue, Solid, and
> Angular now sharing the framework-agnostic web core, "one contract, many frontends" is concrete.
