import { Component, EventEmitter, Input, Output } from "@angular/core";
import { injectThemeBridge } from "./composables.js";

type TextVariant = "heading" | "body" | "label" | "caption";

const VARIANT_TYPO: Record<TextVariant, "pm.typography.heading" | "pm.typography.body" | "pm.typography.label" | "pm.typography.caption"> = {
  heading: "pm.typography.heading",
  body: "pm.typography.body",
  label: "pm.typography.label",
  caption: "pm.typography.caption",
};

@Component({
  standalone: true,
  selector: "polymorph-themed-text",
  // Single <span> renders for every variant. Visual styling (font, size, color) flows from the
  // typography token; the semantic-tag distinction (h2/small/label/span) the other adapters give
  // you isn't expressible here because Angular's projection picks ONE `<ng-content>` slot per
  // template — multiple variant-conditional slots all sharing the default slot leaves the
  // active branch's slot empty. Users who need a semantic heading wrap with their own <h2>.
  template: `<span [style]="style()"><ng-content></ng-content></span>`,
})
export class ThemedTextComponent {
  @Input() variant: TextVariant = "body";
  @Input() muted = false;

  private readonly bridge = injectThemeBridge();

  style(): Record<string, unknown> {
    const t = this.bridge();
    return {
      ...t.typography(VARIANT_TYPO[this.variant]),
      color: t.color(this.muted ? "pm.color.text.muted" : "pm.color.text.body"),
      margin: "0",
    };
  }
}

@Component({
  standalone: true,
  selector: "polymorph-primary-button",
  template: `<button type="button" [style]="style()" [disabled]="disabled" (click)="press.emit()">{{ label }}</button>`,
})
export class PrimaryButtonComponent {
  @Input({ required: true }) label!: string;
  @Input() disabled = false;
  @Output() press = new EventEmitter<void>();

  private readonly bridge = injectThemeBridge();

  style(): Record<string, unknown> {
    const t = this.bridge();
    return {
      backgroundColor: t.color(
        this.disabled ? "pm.color.action.primary.disabled" : "pm.color.action.primary.rest",
      ),
      color: t.color("pm.color.text.onAction"),
      borderRadius: t.dim("pm.radius.control"),
      minHeight: t.dim("pm.size.control.md"),
      padding: `0 ${t.dim("pm.space.md")}`,
      border: "none",
      cursor: this.disabled ? "not-allowed" : "pointer",
      ...t.typography("pm.typography.label"),
    };
  }
}
