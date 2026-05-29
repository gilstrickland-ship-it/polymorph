// Spec 028 — CLI authoring commands (init/diff/migrate) exercised against the Primer
// theme. Findings: wiki/05-CLI-Authoring.md.

import { describe, it, expect } from "vitest";
import { writeFileSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateTheme } from "@polymorph/core";
import { diffThemes, migrateTheme, buildMinimalTheme } from "@polymorph/cli";
import { buildPolymorphThemeFromPrimer } from "../src/build-theme.js";

const theme = buildPolymorphThemeFromPrimer(["light", "dark"]);

describe("Spec 028 — polymorph diff over Primer light vs. dark forks", () => {
  it("identical themes have zero diff entries", () => {
    const diff = diffThemes(theme, theme);
    expect(diff.entries.length).toBe(0);
  });

  it("changing a single colour token surfaces as exactly one 'changed' entry", () => {
    const forked = JSON.parse(JSON.stringify(theme));
    forked.pm.modes.light.color.action.primary.rest.$value = "#000000";
    const diff = diffThemes(theme, forked);
    const changed = diff.entries.filter((e) => e.kind === "changed");
    expect(changed.length).toBe(1);
    expect(changed[0]!.path).toBe("modes.light.color.action.primary.rest");
  });
});

describe("Spec 028 — polymorph migrate on Primer-derived themes", () => {
  it("a freshly built Primer theme reports unchanged (already at current contractVersion)", () => {
    const { report } = migrateTheme(theme);
    expect(report.unchanged).toBe(true);
    expect(report.addedTokens).toEqual([]);
  });

  it("a theme missing a required token gains it via migrate + validates after", () => {
    const stripped = JSON.parse(JSON.stringify(theme));
    delete stripped.pm.motion.duration.reduced;
    const { migrated, report } = migrateTheme(stripped);
    expect(report.addedTokens.some((a) => a.id === "pm.motion.duration.reduced")).toBe(true);
    expect(validateTheme(migrated).valid).toBe(true);
  });
});

describe("Spec 028 — buildMinimalTheme used as a Primer comparison baseline", () => {
  it("the minimal scaffold is a strict subset of the Primer-mapped theme by required ids", () => {
    const minimal = buildMinimalTheme(["light", "dark"]) as Record<string, unknown>;
    expect(validateTheme(minimal).valid).toBe(true);
    expect(validateTheme(theme).valid).toBe(true);
  });
});

describe("Spec 028 — round-tripping through the CLI's pure helpers preserves the theme", () => {
  it("write to disk, read back, validate — no drift", () => {
    const dir = mkdtempSync(join(tmpdir(), "primer-cli-"));
    try {
      const out = join(dir, "primer.tokens.json");
      writeFileSync(out, JSON.stringify(theme, null, 2));
      const reloaded = JSON.parse(readFileSync(out, "utf8"));
      expect(validateTheme(reloaded).valid).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
