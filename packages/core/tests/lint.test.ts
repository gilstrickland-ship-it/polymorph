import { describe, it, expect } from "vitest";
import { resolveTheme } from "../src/resolve.js";
import { lintTheme, lintAllModes } from "../src/lint.js";
import { validateTheme } from "../src/validate.js";
import { coreFixture, specFixture } from "./helpers.js";

const codes = (rt: ReturnType<typeof resolveTheme>) => lintTheme(rt).map((w) => w.code);

describe("lintTheme (advisory, WCAG 2.1)", () => {
  it("flags low body-text contrast, naming both tokens", () => {
    const rt = resolveTheme(coreFixture("low-contrast"), "light");
    const warnings = lintTheme(rt);
    const low = warnings.find((w) => w.code === "CONTRAST_TEXT_LOW");
    expect(low).toBeTruthy();
    expect(low!.tokenIds).toEqual(["pm.color.text.body", "pm.color.surface.base"]);
    expect(low!.threshold).toBe(4.5);
  });

  it("is non-blocking: a low-contrast theme is still valid", () => {
    expect(validateTheme(coreFixture("low-contrast")).valid).toBe(true);
  });

  const findBodyOnBase = (rt: ReturnType<typeof resolveTheme>) =>
    lintTheme(rt).find(
      (w) =>
        w.code === "CONTRAST_TEXT_LOW" &&
        w.tokenIds[0] === "pm.color.text.body" &&
        w.tokenIds[1] === "pm.color.surface.base",
    );

  it("does not flag adequate body-on-base contrast", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.pm.modes.light.color.surface.base.$value = "#0b1020";
    theme.pm.modes.light.color.text.body.$value = "#ffffff";
    expect(findBodyOnBase(resolveTheme(theme, "light"))).toBeUndefined();
  });

  it("skips (not fails) genuinely unparseable colors (e.g. `currentColor`)", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.pm.modes.light.color.text.body.$value = "currentColor";
    theme.pm.modes.light.color.surface.base.$value = "#000000";
    expect(codes(resolveTheme(theme, "light"))).toContain("CONTRAST_SKIPPED_UNPARSEABLE");
  });

  it("evaluates modern CSS color forms (oklch / display-p3) rather than skipping", () => {
    // adequate contrast in oklch space → no body-on-base warning, no skip on that specific pair
    const ok = specFixture("valid", "minimal-light") as any;
    ok.pm.modes.light.color.surface.base.$value = "oklch(0.12 0.02 260)"; // near-black
    ok.pm.modes.light.color.text.body.$value = "oklch(0.97 0 0)";           // near-white
    expect(findBodyOnBase(resolveTheme(ok, "light"))).toBeUndefined();
    expect(codes(resolveTheme(ok, "light"))).not.toContain("CONTRAST_SKIPPED_UNPARSEABLE");

    // poor contrast in display-p3 → body-on-base flagged (the new color format actually fires)
    const bad = specFixture("valid", "minimal-light") as any;
    bad.pm.modes.light.color.surface.base.$value = "color(display-p3 0.95 0.95 0.95)";
    bad.pm.modes.light.color.text.body.$value = "color(display-p3 0.85 0.85 0.85)";
    expect(findBodyOnBase(resolveTheme(bad, "light"))).toBeTruthy();
  });

  it("flags a too-small touch target", () => {
    // minimal-light uses 8px for all dimensions → below the 44px advisory minimum
    expect(codes(resolveTheme(specFixture("valid", "minimal-light"), "light"))).toContain("TOUCH_TARGET_SMALL");
  });
});

describe("lintTheme — strengthened rule families (v2)", () => {
  const aurora = (mode: "light" | "dark") =>
    resolveTheme(
      JSON.parse(
        require("node:fs").readFileSync(
          require("node:path").join(__dirname, "..", "..", "..", "examples", "mock-bank-aurora", "theme", "aurora.tokens.json"),
          "utf8",
        ),
      ),
      mode,
    );

  it("a real bank fixture (Aurora light) passes the core text-on-surface rule for body, link, and onAction", () => {
    // The bank fixtures intentionally exercise *some* low-contrast advisory cases (a
    // `text.disabled` that's deliberately faded, accent feedback colors that don't meet AA on
    // white, an outline-button pattern with body text on a neutral fill). The linter
    // surfaces those as `DISABLED_TEXT_LOW` / `CONTRAST_FEEDBACK_LOW` / `COMPONENT_CONTRAST_LOW`
    // — known-acceptable for these fixtures. But the **central** body/onAction pairings MUST
    // pass: if they don't, the fixture is broken, not the fixture's intentional roughness.
    const warnings = lintTheme(aurora("light"));
    const central = warnings.filter(
      (w) =>
        (w.code === "CONTRAST_TEXT_LOW" &&
          w.tokenIds[0] === "pm.color.text.body" &&
          w.tokenIds[1] === "pm.color.surface.base") ||
        (w.code === "CONTRAST_ON_ACTION_LOW" &&
          w.tokenIds[1] === "pm.color.action.primary.rest"),
    );
    expect(central).toEqual([]);
  });

  it("flags low feedback-text contrast (`feedback.warning` is often a yellow that fails on white)", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.pm.modes.light.color.surface.base.$value = "#ffffff";
    theme.pm.modes.light.color.feedback.warning.$value = "#ffd900"; // bright yellow on white, low contrast
    const w = lintTheme(resolveTheme(theme, "light")).find(
      (w) => w.code === "CONTRAST_FEEDBACK_LOW" && w.tokenIds[0] === "pm.color.feedback.warning",
    );
    expect(w).toBeTruthy();
  });

  it("flags an invisible focus ring (border.focus too close to surface.base)", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.pm.modes.light.color.surface.base.$value = "#ffffff";
    theme.pm.modes.light.color.border.focus.$value = "#f6f6f6"; // ~1.05:1 on white
    const w = lintTheme(resolveTheme(theme, "light")).find((w) => w.code === "FOCUS_RING_LOW");
    expect(w).toBeTruthy();
    expect(w!.threshold).toBe(3.0);
  });

  it("flags low default-border contrast separately from the focus ring", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.pm.modes.light.color.surface.base.$value = "#ffffff";
    theme.pm.modes.light.color.border.default.$value = "#f8f8f8";
    const w = lintTheme(resolveTheme(theme, "light")).find((w) => w.code === "BORDER_DEFAULT_LOW");
    expect(w).toBeTruthy();
    expect(w!.threshold).toBe(3.0);
  });

  it("flags low `onInverse` contrast on `surface.inverse`", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    // surface.inverse is optional; declaring both halves of the pair to bad values
    theme.pm.modes.light.color.surface.inverse = { $type: "color", $value: "#222222" };
    theme.pm.modes.light.color.text.onInverse = { $type: "color", $value: "#444444" };
    const w = lintTheme(resolveTheme(theme, "light")).find((w) => w.code === "CONTRAST_ON_INVERSE_LOW");
    expect(w).toBeTruthy();
  });

  it("flags `text.disabled` with low contrast under the AA-large 3.0 threshold (not the 4.5 text threshold)", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.pm.modes.light.color.surface.base.$value = "#ffffff";
    theme.pm.modes.light.color.text.disabled.$value = "#f4f4f4"; // too light even for disabled
    const w = lintTheme(resolveTheme(theme, "light")).find((w) => w.code === "DISABLED_TEXT_LOW");
    expect(w).toBeTruthy();
    expect(w!.threshold).toBe(3.0);
  });

  it("flags a long motion.duration.base", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    theme.pm.motion = theme.pm.motion ?? {};
    theme.pm.motion.duration = theme.pm.motion.duration ?? {};
    theme.pm.motion.duration.base = { $type: "duration", $value: { value: 900, unit: "ms" } };
    const w = lintTheme(resolveTheme(theme, "light")).find((w) => w.code === "MOTION_BASE_LONG");
    expect(w).toBeTruthy();
    expect(w!.measured).toBe(900);
  });

  it("widens the on-action matrix beyond `primary.rest` (hover/pressed + secondary + danger)", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    // text.onAction stays at the fixture's dark grey; danger.rest already dark grey → low contrast
    const warnings = lintTheme(resolveTheme(theme, "light")).filter((w) => w.code === "CONTRAST_ON_ACTION_LOW");
    const bgIds = warnings.map((w) => w.tokenIds[1]).sort();
    // expect coverage across primary/secondary/danger (rest+hover+pressed exist in minimal as well via defaults)
    expect(bgIds).toContain("pm.color.action.primary.rest");
    expect(bgIds).toContain("pm.color.action.secondary.rest");
    expect(bgIds).toContain("pm.color.action.danger.rest");
  });

  it("checks component-token fg/bg contrast independently from semantic-token contrast", () => {
    const theme = specFixture("valid", "minimal-light") as any;
    // Override button.primary explicitly to a low-contrast pair (regardless of action.primary.rest).
    theme.pm.components = theme.pm.components ?? {};
    theme.pm.components["button.primary"] = {
      background: { $type: "color", $value: "#f0f0f0" },
      foreground: { $type: "color", $value: "#dddddd" },
    };
    const w = lintTheme(resolveTheme(theme, "light")).find(
      (w) => w.code === "COMPONENT_CONTRAST_LOW" && w.tokenIds[0] === "button.primary.foreground",
    );
    expect(w).toBeTruthy();
  });
});

describe("lintAllModes", () => {
  it("lints every declared mode and tags each warning with the mode it surfaced in", () => {
    const auroraTheme = JSON.parse(
      require("node:fs").readFileSync(
        require("node:path").join(__dirname, "..", "..", "..", "examples", "mock-bank-aurora", "theme", "aurora.tokens.json"),
        "utf8",
      ),
    );
    const results = lintAllModes(auroraTheme);
    expect(results.map((r) => r.mode).sort()).toEqual(["dark", "light"]);
    for (const r of results) expect(Array.isArray(r.warnings)).toBe(true);
  });
});
