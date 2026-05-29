// Project-local policy packs.
//
// FIs ship lint policies their internal brand / compliance / locale teams care about
// without forking @polymorph/core. A `PolicyPack` carries a name + version + an array of
// `PolicyRule` functions that each receive the resolved theme and return any warnings they
// want to add. The runtime composes packs with the built-in lint via `lintWithPolicies`.
//
// What pack rules can do:
//  - Read any token value (`pm.*`) and any component-role property from the resolved theme.
//  - Read the active mode (via `rt.mode`).
//  - Emit `LintWarning` rows with any string code (typically FI-namespaced — e.g.
//    `BANK_ACCESSIBILITY_LARGE_TEXT`).
//
// What they can't do:
//  - Throw (rules SHOULD swallow internal errors; if a rule throws, the runtime catches it
//    and emits a synthetic `POLICY_RULE_ERROR` warning so the policy pipeline never aborts
//    the lint run).
//  - Mutate the resolved theme (TS doesn't enforce this, but rules treat `rt` as immutable).
//  - Read outside the resolved-theme snapshot (no I/O, no filesystem, no network — packs
//    are pure value-in / warnings-out functions).

import type { ResolvedTheme } from "@polymorph/spec";
import type { LintWarning } from "./errors.js";
import { lintTheme } from "./lint.js";

/** A single rule belonging to a policy pack. Pure: `(rt) → warnings`. */
export type PolicyRule = (rt: ResolvedTheme) => LintWarning[];

export interface PolicyPack {
  /** Stable identifier (typically `org-name/pack-name`). Surfaced in audit / debug output. */
  name: string;
  /** SemVer or any string the FI uses for change-tracking. Surfaced in audit output. */
  version: string;
  rules: PolicyRule[];
  /** Free-text description for the docs / package homepage. Not interpreted by the runtime. */
  description?: string;
}

/** Convenience constructor — type-checks the shape at the pack declaration site. */
export function definePolicyPack(pack: PolicyPack): PolicyPack {
  return pack;
}

/**
 * Run every pack against the resolved theme + concatenate with the built-in `lintTheme`
 * output. A rule that throws is swallowed and surfaces as a synthetic `POLICY_RULE_ERROR`
 * warning so the lint pipeline never aborts mid-stream.
 *
 * The order is deterministic: built-in warnings first, then packs in array order. Within a
 * pack, rules fire in array order. Callers that care about stable diffs in CI consume the
 * full array as-is.
 */
export function lintWithPolicies(rt: ResolvedTheme, packs: PolicyPack[] = []): LintWarning[] {
  const out: LintWarning[] = [...lintTheme(rt)];
  for (const pack of packs) {
    for (const rule of pack.rules) {
      try {
        out.push(...rule(rt));
      } catch (e) {
        out.push({
          code: "POLICY_RULE_ERROR",
          message: `policy pack '${pack.name}' (v${pack.version}) rule threw: ${(e as Error).message}`,
          tokenIds: [],
          measured: 0,
          threshold: 0,
        });
      }
    }
  }
  return out;
}

/**
 * Filter helper for CI gating. Returns the warnings whose code matches the predicate —
 * typically used to escalate a subset (`PROTECTED_*`, FI-namespaced critical rules) into
 * a CI failure while letting the rest stay advisory.
 *
 * ```ts
 * const critical = filterWarnings(warnings, (code) =>
 *   code.startsWith("PROTECTED_") || code === "BANK_BRAND_GUARD",
 * );
 * if (critical.length > 0) throw new Error("CI gate: critical lint warnings");
 * ```
 */
export function filterWarnings(
  warnings: LintWarning[],
  predicate: (code: string) => boolean,
): LintWarning[] {
  return warnings.filter((w) => predicate(w.code));
}

/**
 * Convenience builder for a single warning. Trims boilerplate at the rule-author site —
 * packs typically emit one warning per offending token, and this keeps the call-site terse.
 */
export function warning(
  code: string,
  message: string,
  tokenIds: string[] = [],
  measured = 0,
  threshold = 0,
): LintWarning {
  return { code, message, tokenIds, measured, threshold };
}
