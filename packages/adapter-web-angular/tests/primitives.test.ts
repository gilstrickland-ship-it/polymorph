import { describe, it, expect, beforeEach } from "vitest";
import { Component, Input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  ThemeProviderComponent,
  ThemedTextComponent,
  PrimaryButtonComponent,
} from "../src/index.js";
import { makeResolved } from "./helpers.js";

beforeEach(() => {
  TestBed.resetTestingModule();
});

const rt = makeResolved("light");

@Component({
  standalone: true,
  imports: [ThemeProviderComponent, ThemedTextComponent, PrimaryButtonComponent],
  template: `
    <polymorph-theme-provider [theme]="theme">
      <polymorph-themed-text [variant]="variant" [muted]="muted">{{ text }}</polymorph-themed-text>
      <polymorph-primary-button [label]="label" [disabled]="disabled" (press)="onPress()" />
    </polymorph-theme-provider>
  `,
})
class HostComponent {
  @Input() theme = rt;
  @Input() variant: "heading" | "body" | "label" | "caption" = "heading";
  @Input() muted = false;
  @Input() text = "Open your account";
  @Input() label = "Continue";
  @Input() disabled = false;
  pressed = 0;
  onPress(): void {
    this.pressed++;
  }
}

describe("themed primitives (Angular)", () => {
  it("ThemedText renders the right tag and inline styles via var(--…)", () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    // Angular's ThemedText always renders <span> (regardless of variant) — the dynamic-tag
    // pattern the other adapters use isn't expressible through Angular's projection model.
    // The variant still selects the right typography token.
    const span = root.querySelector("polymorph-themed-text > span");
    expect(span).toBeTruthy();
    expect(span?.textContent?.trim()).toBe("Open your account");
    const style = span?.getAttribute("style") ?? "";
    // Angular normalises camelCase style keys to kebab.
    expect(style).toContain("var(--pm-typography-heading-font-family)");
    expect(style).toContain("var(--pm-color-text-body)");
  });

  it("ThemedText muted variant uses the muted color token", () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentRef.setInput("variant", "caption");
    fixture.componentRef.setInput("muted", true);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const span = root.querySelector("polymorph-themed-text > span");
    const style = span?.getAttribute("style") ?? "";
    expect(style).toContain("var(--pm-color-text-muted)");
    expect(style).toContain("var(--pm-typography-caption-font-size)");
  });

  it("PrimaryButton emits press on click and renders disabled state", () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    const btn = root.querySelector("button") as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.pressed).toBe(1);

    fixture.componentRef.setInput("disabled", true);
    fixture.detectChanges();
    const disabledStyle = (root.querySelector("button") as HTMLButtonElement).getAttribute("style") ?? "";
    expect(disabledStyle).toContain("var(--pm-color-action-primary-disabled)");
    expect(btn.disabled).toBe(true);
  });
});
