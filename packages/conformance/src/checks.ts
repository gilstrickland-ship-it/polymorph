import { validateTheme, resolveTheme, declaredModes } from "@polymorph/core";
import { REQUIRED_TOKEN_IDS, COMPONENT_ROLES } from "@polymorph/spec";
import type { ResolvedTheme } from "@polymorph/spec";

export interface ConformanceCheck {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface ConformanceReport {
  passed: boolean;
  checks: ConformanceCheck[];
}

const mk = (name: string, passed: boolean, detail?: string): ConformanceCheck =>
  detail === undefined ? { name, passed } : { name, passed, detail };

const hasAlias = (v: unknown): boolean => typeof v === "string" && /^\{.+\}$/.test(v);
type Tokens = Record<string, { value: unknown } | undefined>;
type Components = Record<string, Record<string, unknown> | undefined>;

/** Invariants every resolved theme must satisfy (the shape adapters consume). */
export function checkResolvedInvariants(rt: ResolvedTheme): ConformanceCheck[] {
  const tokens = rt.tokens as Tokens;
  const components = rt.components as Components;
  const out: ConformanceCheck[] = [];

  const missing = REQUIRED_TOKEN_IDS.filter((id) => tokens[id] === undefined);
  out.push(mk(`[${rt.mode}] required tokens present`, missing.length === 0, missing.length ? `missing: ${missing.slice(0, 5).join(", ")}` : undefined));

  const aliased = Object.entries(tokens).filter(([, t]) => hasAlias(t?.value)).map(([k]) => k);
  out.push(mk(`[${rt.mode}] no aliases remain`, aliased.length === 0, aliased.length ? `aliased: ${aliased.slice(0, 5).join(", ")}` : undefined));

  const nonPm = Object.keys(tokens).filter((k) => !k.startsWith("pm."));
  out.push(mk(`[${rt.mode}] pm-only token keys`, nonPm.length === 0, nonPm.length ? `foreign: ${nonPm.slice(0, 5).join(", ")}` : undefined));

  const badRole = COMPONENT_ROLES.find((r) => {
    const c = components[r.role];
    return !c || r.properties.some((p) => c[p.property] === undefined);
  });
  out.push(mk(`[${rt.mode}] component roles resolved (fallback applied)`, badRole === undefined, badRole ? `role ${badRole.role} incomplete` : undefined));

  return out;
}

/** Run the full theme-level conformance bar: validity + resolution invariants for every mode. */
export function runThemeConformance(theme: unknown): ConformanceReport {
  const checks: ConformanceCheck[] = [];

  const v = validateTheme(theme);
  checks.push(mk("theme validates (schema + graph)", v.valid, v.valid ? undefined : v.errors.slice(0, 3).map((e) => e.message).join(" | ")));

  if (v.valid) {
    const modes = declaredModes(theme);
    checks.push(mk("declares the default 'light' mode", modes.includes("light")));
    for (const mode of modes) {
      try {
        checks.push(...checkResolvedInvariants(resolveTheme(theme, mode)));
      } catch (e) {
        checks.push(mk(`[${mode}] resolves`, false, (e as Error).message));
      }
    }
  }

  return { passed: checks.every((c) => c.passed), checks };
}

/** Throws a readable error listing failed checks; for use in adapter/theme test suites. */
export function assertConforms(theme: unknown, label = "theme"): void {
  const report = runThemeConformance(theme);
  if (!report.passed) {
    const failed = report.checks
      .filter((c) => !c.passed)
      .map((c) => `  ✗ ${c.name}${c.detail ? `: ${c.detail}` : ""}`)
      .join("\n");
    throw new Error(`${label} failed conformance:\n${failed}`);
  }
}
