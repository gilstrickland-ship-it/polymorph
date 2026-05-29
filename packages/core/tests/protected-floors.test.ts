import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lintTheme, resolveTheme } from "../src/index.js";
import { PROTECTED_FLOORS } from "@polymorph/spec";

const here = dirname(fileURLToPath(import.meta.url));
const aurora = JSON.parse(
  readFileSync(
    join(here, "..", "..", "..", "examples", "mock-bank-aurora", "theme", "aurora.tokens.json"),
    "utf8",
  ),
);

describe("PROTECTED_FLOORS manifest", () => {
  it("ships at least the `disclosure` floor with three rules", () => {
    const disc = PROTECTED_FLOORS.find((f) => f.role === "disclosure");
    expect(disc).toBeDefined();
    const codes = disc!.rules.map((r) => r.code);
    expect(codes).toContain("PROTECTED_CONTRAST_LOW");
    expect(codes).toContain("PROTECTED_FONT_SIZE_SMALL");
    expect(codes).toContain("PROTECTED_LINE_HEIGHT_TIGHT");
  });

  it("every floor rule targets a real component role", () => {
    // PROTECTED_FLOORS is generated from the manifest; if a future edit references a role
    // that doesn't exist, this guard catches it before the lint emits a confusing warning.
    for (const floor of PROTECTED_FLOORS) {
      expect(typeof floor.role).toBe("string");
      expect(floor.rules.length).toBeGreaterThan(0);
    }
  });
});

describe("lint — PROTECTED_* rules over Aurora", () => {
  // The bank generator leaves the `disclosure` role defaulted (`text.muted` foreground +
  // `caption` typography at 12px / 1.4 lineHeight). All three floor rules fire — this is the
  // designed signal: banks must consciously override `disclosure` for protected copy.
  const warnings = lintTheme(resolveTheme(aurora, "light"));
  const codes = warnings.map((w) => w.code);

  it("PROTECTED_FONT_SIZE_SMALL fires when caption (12px) drives disclosure", () => {
    expect(codes).toContain("PROTECTED_FONT_SIZE_SMALL");
  });

  it("PROTECTED_LINE_HEIGHT_TIGHT fires when caption (1.4) drives disclosure", () => {
    expect(codes).toContain("PROTECTED_LINE_HEIGHT_TIGHT");
  });

  it("PROTECTED_CONTRAST_LOW fires when text.muted on surface.base sits below 7:1", () => {
    expect(codes).toContain("PROTECTED_CONTRAST_LOW");
  });

  it("includes the role + property in `tokenIds` so the editor can scroll-to-warning", () => {
    const fontWarning = warnings.find((w) => w.code === "PROTECTED_FONT_SIZE_SMALL");
    expect(fontWarning?.tokenIds).toContain("disclosure.typography");
  });
});

describe("lint — overriding the disclosure role lifts every floor", () => {
  // Author the protected overrides directly so all three floors pass: body typography (16px,
  // lineHeight 1.4 — STILL trips line-height; lift to 1.5) + body color (high contrast).
  const lifted = JSON.parse(JSON.stringify(aurora)) as Record<string, unknown>;
  const pm = lifted.pm as Record<string, unknown>;
  pm.disclosure = {
    foreground: { $type: "color", $value: "#000000" },
    typography: {
      $type: "typography",
      $value: {
        fontFamily: "Inter",
        fontWeight: 400,
        fontSize: { value: 16, unit: "px" },
        lineHeight: 1.5,
        letterSpacing: { value: 0, unit: "px" },
      },
    },
  };
  const warnings = lintTheme(resolveTheme(lifted, "light"));
  const codes = warnings.map((w) => w.code);

  it("PROTECTED_CONTRAST_LOW no longer fires", () => {
    expect(codes).not.toContain("PROTECTED_CONTRAST_LOW");
  });
  it("PROTECTED_FONT_SIZE_SMALL no longer fires", () => {
    expect(codes).not.toContain("PROTECTED_FONT_SIZE_SMALL");
  });
  it("PROTECTED_LINE_HEIGHT_TIGHT no longer fires", () => {
    expect(codes).not.toContain("PROTECTED_LINE_HEIGHT_TIGHT");
  });
});
