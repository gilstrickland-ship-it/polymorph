import { describe, it, expect, beforeEach } from "vitest";
import { Component, Input, OnInit, Type } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  ThemeProviderComponent,
  injectTheme,
  injectThemeBridge,
  injectSlot,
  injectResolvedTheme,
} from "../src/index.js";
// Re-import the type directly — re-export through index produces `never` in this TS context.
import type { ThemeContextValue } from "../src/types.js";
import { makeResolved } from "./helpers.js";

beforeEach(() => {
  TestBed.resetTestingModule();
});

const rt = makeResolved("light");

// Probes capture in ngOnInit (NOT the constructor) — at construction time the parent
// provider's ngOnChanges hasn't run yet, so the signal is still null.
let capturedTheme: ThemeContextValue | undefined;
@Component({ standalone: true, selector: "test-probe", template: "" })
class ProbeThemeComponent implements OnInit {
  private readonly themeAccessor = injectTheme();
  ngOnInit(): void {
    capturedTheme = this.themeAccessor();
  }
}

let capturedBridgeColor: string | undefined;
@Component({ standalone: true, selector: "test-probe-bridge", template: "" })
class ProbeBridgeComponent implements OnInit {
  private readonly bridge = injectThemeBridge();
  ngOnInit(): void {
    capturedBridgeColor = this.bridge().color("pm.color.surface.base");
  }
}

const Fallback = class FallbackComp {} as unknown as Type<unknown>;
const Override = class OverrideComp {} as unknown as Type<unknown>;

let capturedSlot: Type<unknown> | undefined;
@Component({ standalone: true, selector: "test-probe-slot", template: "" })
class ProbeSlotComponent implements OnInit {
  private readonly slotAccessor = injectSlot("PrimaryButton", Fallback);
  ngOnInit(): void {
    capturedSlot = this.slotAccessor();
  }
}

@Component({
  standalone: true,
  imports: [ThemeProviderComponent, ProbeThemeComponent, ProbeBridgeComponent, ProbeSlotComponent],
  template: `
    <polymorph-theme-provider [theme]="theme" [slots]="slots">
      <test-probe></test-probe>
      <test-probe-bridge></test-probe-bridge>
      <test-probe-slot></test-probe-slot>
    </polymorph-theme-provider>
  `,
})
class HostComponent {
  @Input() theme = rt;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() slots: Record<string, any> = {};
}

@Component({ standalone: true, selector: "bare", template: "" })
class BareComponent {
  constructor() {
    injectResolvedTheme();
  }
}

describe("ThemeProviderComponent / injectTheme", () => {
  it("provides theme + bridge to descendants via DI", () => {
    capturedTheme = undefined;
    capturedBridgeColor = undefined;
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(capturedTheme).toBeDefined();
    expect(capturedTheme!.theme).toBe(rt);
    expect(capturedTheme!.scope).toMatch(/^pm-theme-\d+$/);
    expect(capturedBridgeColor).toBe("var(--pm-color-surface-base)");
  });

  it("emits a scoped <style> block with the resolved CSS variables", () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const styleEl = host.querySelector("style");
    expect(styleEl).toBeTruthy();
    const css = styleEl?.textContent ?? "";
    expect(css).toMatch(/\.pm-theme-\d+ \{/);
    expect(css).toMatch(/--pm-color-surface-base: \S+;/);
    expect(css).toMatch(/--pm-typography-body-font-size:/);
  });

  it("injectSlot returns the host override when registered, else the default", () => {
    capturedSlot = undefined;
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentRef.setInput("slots", { PrimaryButton: Override });
    fixture.detectChanges();
    expect(capturedSlot).toBe(Override);

    TestBed.resetTestingModule();
    capturedSlot = undefined;
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture2 = TestBed.createComponent(HostComponent);
    fixture2.detectChanges();
    expect(capturedSlot).toBe(Fallback);
  });

  it("injectTheme throws outside a provider", () => {
    TestBed.configureTestingModule({ imports: [BareComponent] });
    expect(() => TestBed.createComponent(BareComponent)).toThrow(/polymorph-theme-provider/);
  });
});
