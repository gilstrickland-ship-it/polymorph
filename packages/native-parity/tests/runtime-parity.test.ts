import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveTheme } from "@polymorph/core";
import { toCssVariables } from "@polymorph/adapter-web";
import { transformToDart } from "@polymorph/adapter-flutter";
import type { ThemeMode } from "@polymorph/spec";

import {
  checkRuntimeParity,
  assertRuntimeParity,
  normalizeResolved,
  parseCssVars,
  parseDart,
  idToCamelName,
  diffSnapshots,
} from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");

const loadBank = (name: "aurora" | "borealis"): unknown =>
  JSON.parse(readFileSync(join(repoRoot, "examples", `mock-bank-${name}`, "theme", `${name}.tokens.json`), "utf8"));

const banks = [
  { name: "aurora", theme: loadBank("aurora") },
  { name: "borealis", theme: loadBank("borealis") },
] as const;
const modes: ThemeMode[] = ["light", "dark"];

const fixtures = banks.flatMap((b) => modes.map((mode) => ({ bank: b.name, theme: b.theme, mode })));

describe("normalizeResolved — core baseline", () => {
  it("emits camelCase keys matching the native parsers' naming convention", () => {
    const rt = resolveTheme(banks[0].theme, "light");
    const snap = normalizeResolved(rt);
    expect(snap.has("colorSurfaceBase")).toBe(true);
    expect(snap.has("spaceMd")).toBe(true);
  });

  it("idToCamelName: pm.color.action.primary.rest → colorActionPrimaryRest", () => {
    expect(idToCamelName("pm.color.action.primary.rest")).toBe("colorActionPrimaryRest");
    expect(idToCamelName("pm.motion.duration.short")).toBe("motionDurationShort");
  });
});

describe("parseCssVars — Web adapter round-trip", () => {
  it("recovers a typography composite from its five sub-variables", () => {
    const rt = resolveTheme(banks[0].theme, "light");
    const vars = toCssVariables(rt);
    const snap = parseCssVars(vars);
    const body = snap.get("typographyBody");
    expect(body?.kind).toBe("typography");
    if (body?.kind === "typography") {
      expect(body.family).toBeTruthy();
      expect(body.fontSizePx).toBeGreaterThan(0);
    }
  });

  it("parses motion duration / easing back to canonical form", () => {
    const rt = resolveTheme(banks[0].theme, "light");
    const snap = parseCssVars(toCssVariables(rt));
    const dur = snap.get("motionDurationBase");
    expect(dur?.kind).toBe("duration");
    const easing = snap.get("motionEasingStandard");
    expect(easing?.kind).toBe("cubicBezier");
  });
});

describe("checkRuntimeParity — every adapter agrees with core resolution", () => {
  for (const f of fixtures) {
    it(`${f.bank}[${f.mode}]: web-css + dart + swift + kotlin all match core baseline`, () => {
      const results = checkRuntimeParity(f.theme, f.mode);
      const failing = results.filter((r) => r.mismatches.length > 0);
      expect(failing).toEqual([]);
    });

    it(`${f.bank}[${f.mode}]: assertRuntimeParity does not throw`, () => {
      expect(() => assertRuntimeParity(f.theme, f.mode, f.bank)).not.toThrow();
    });
  }
});

describe("checkRuntimeParity — catches a deliberately divergent adapter", () => {
  // Inject a Web-side divergence: serve a CSS vars map missing one variable. The check
  // should surface that as a per-adapter mismatch list, demonstrating it works as a guard
  // (not just an always-green check).
  it("reports missing variables as mismatches", () => {
    const rt = resolveTheme(banks[0].theme, "light");
    const baseline = normalizeResolved(rt);
    const vars = toCssVariables(rt);
    delete vars["--pm-color-surface-base"];
    const tampered = parseCssVars(vars);
    const mismatches = diffSnapshots(baseline, tampered);
    expect(mismatches.length).toBeGreaterThan(0);
    expect(mismatches.some((m) => m.name === "colorSurfaceBase")).toBe(true);
  });

  it("reports value mismatches with both sides surfaced", () => {
    const rt = resolveTheme(banks[0].theme, "light");
    const baseline = normalizeResolved(rt);
    // Hand-edit the emitted Dart to disagree on one constant. The error reporter must show
    // baseline + tampered values so the failing diff is debuggable.
    const dart = transformToDart(banks[0].theme, { mode: "light", className: "Probe" });
    const tampered = dart.replace(/0xFF1F5CFF/g, "0xFF000000");
    const snap = parseDart(tampered);
    const mismatches = diffSnapshots(baseline, snap);
    expect(mismatches.length).toBeGreaterThan(0);
  });
});
