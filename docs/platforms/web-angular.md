# Angular 18+

`@polymorph/adapter-web-angular` wraps the web core with Angular's DI + signals model. The
provider component registers a per-instance `WritableSignal<ThemeContextValue | null>` under
an `InjectionToken`; consumers `inject()` it via composable helpers.

`@angular/core >= 18` is an **optional peer** — installing the adapter doesn't drag Angular
into a non-Angular workspace.

## Setup

```ts
import { Component } from "@angular/core";
import { ThemeProviderComponent } from "@polymorph/adapter-web-angular";

@Component({
  standalone: true,
  imports: [ThemeProviderComponent, OnboardingComponent],
  template: `
    <polymorph-theme-provider [theme]="resolved">
      <app-onboarding />
    </polymorph-theme-provider>
  `,
})
export class AppComponent { resolved = /* resolveTheme(..., "light") */; }
```

## inject() helpers

| Helper | Returns |
|---|---|
| `injectTheme()` | accessor → `{ resolved, bridge, scopeClassName } \| null` |
| `injectResolvedTheme()` | accessor → `ResolvedTheme \| null` |
| `injectSlot(name, fallback)` | accessor → host override or `fallback` |
| `injectThemedComponent(role, fallback)` | accessor → host component or `fallback` |

Each throws a clear error outside a `<polymorph-theme-provider>`.

## Two Angular-specific traps

### 1. Capture in `ngOnInit`, not the constructor

At construction time, the provider's `ngOnChanges` hasn't run yet — the signal is still
`null`. Consumers that need a snapshot of the context should read `injectTheme()()` in
`ngOnInit`.

```ts
@Component(...)
class Probe implements OnInit {
  private theme = injectTheme();
  ngOnInit() {
    const ctx = this.theme();   // safe here
  }
}
```

### 2. Template `<style>` blocks are stripped

Angular's compiler extracts template `<style>` into the component's `styles` array — they
never reach the DOM as real elements. The provider creates its scoped `<style>` imperatively
via `Renderer2`. End users don't need to do anything; this only matters if you fork the
provider.

## Themed primitives

```html
<polymorph-themed-text variant="body">Hello</polymorph-themed-text>
<polymorph-primary-button (press)="next()">Continue</polymorph-primary-button>
```

`ThemedText` always renders a `<span>` (Angular's projection model can't dynamically pick a
semantic tag) — wrap with `<h2>`/`<small>` yourself where it matters.
