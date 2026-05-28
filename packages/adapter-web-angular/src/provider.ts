import { Component, ElementRef, Input, OnChanges, Renderer2, signal, inject } from "@angular/core";
import type { ResolvedTheme } from "@polymorph/spec";
import { createBridge, toCssVariablesString } from "@polymorph/adapter-web";
import { THEME_TOKEN } from "./context.js";
import type { ComponentRegistry, SlotComponents, ThemeStore } from "./types.js";

let _scopeCounter = 0;
const nextScopeId = (): string => `pm-theme-${++_scopeCounter}`;

/**
 * `<polymorph-theme-provider [theme]="…">`. Each instance gets its own component-scoped
 * `WritableSignal<ThemeContextValue | null>` via the providers' factory; `ngOnChanges` keeps it
 * in sync with the inputs. Descendants read via `inject(THEME_TOKEN)` (or the `injectTheme()`
 * helper).
 *
 * The CSS-variable `<style>` block is created imperatively via `Renderer2` rather than declared
 * in the template, because Angular's template compiler extracts template-level `<style>` tags
 * into the component's styles array and they never reach the DOM as real `<style>` elements.
 */
@Component({
  standalone: true,
  selector: "polymorph-theme-provider",
  template: `<div [class]="scopeName()"><ng-content></ng-content></div>`,
  providers: [{ provide: THEME_TOKEN, useFactory: (): ThemeStore => signal(null) }],
})
export class ThemeProviderComponent implements OnChanges {
  @Input({ required: true }) theme!: ResolvedTheme;
  @Input() slots: SlotComponents = {};
  @Input() components: ComponentRegistry = {};
  @Input() scope?: string;

  private readonly themeSig = inject(THEME_TOKEN);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly uid = nextScopeId();
  private readonly styleEl: HTMLStyleElement;

  constructor() {
    this.styleEl = this.renderer.createElement("style") as HTMLStyleElement;
    this.renderer.setAttribute(this.styleEl, "data-polymorph-theme", this.uid);
    this.renderer.insertBefore(
      this.host.nativeElement,
      this.styleEl,
      this.host.nativeElement.firstChild,
    );
  }

  scopeName(): string {
    return this.scope ?? this.uid;
  }

  ngOnChanges(): void {
    if (!this.theme) return;
    const scope = this.scopeName();
    this.renderer.setProperty(
      this.styleEl,
      "textContent",
      toCssVariablesString(this.theme, `.${scope}`),
    );
    this.renderer.setAttribute(this.styleEl, "data-polymorph-theme", scope);
    this.themeSig.set({
      theme: this.theme,
      bridge: createBridge(this.theme),
      slots: this.slots,
      components: this.components,
      scope,
    });
  }
}
