import { resolveTheme } from "@polymorph/core";
import { toCssVariables } from "@polymorph/adapter-web";
import { transformToDart } from "@polymorph/adapter-flutter";
import { transformToSwift } from "@polymorph/adapter-swift";
import { transformToKotlin } from "@polymorph/adapter-kotlin";
import type { ThemeMode } from "@polymorph/spec";

import { parseDart } from "./parse-dart.js";
import { parseSwift } from "./parse-swift.js";
import { parseKotlin } from "./parse-kotlin.js";
import { parseCssVars } from "./parse-css-vars.js";
import { normalizeResolved } from "./normalize-resolved.js";
import { diffSnapshots, type ParityMismatch } from "./diff.js";
import type { NormalizedSnapshot } from "./types.js";

/** Per-adapter parity result against the core baseline. Empty `mismatches` ⇒ adapter agrees. */
export interface AdapterParity {
  adapter: "web-css" | "dart" | "swift" | "kotlin";
  mismatches: ParityMismatch[];
}

/**
 * Compute every adapter's snapshot for a theme + mode and diff each against the baseline
 * computed directly from `resolveTheme`. Returns the per-adapter mismatch list — empty
 * lists mean the adapter's emitted form agrees with core on every token.
 *
 * Catches divergence at the resolve layer before adapter goldens do. If core resolves
 * `pm.color.surface.base` to one hex and the Web adapter emits a different one, this
 * surfaces it without needing a rendered snapshot.
 */
export function checkRuntimeParity(theme: unknown, mode: ThemeMode): AdapterParity[] {
  const rt = resolveTheme(theme, mode);
  // The Web adapter doesn't emit component-role flat vars (component slots consume tokens
  // through React props); native adapters emit constants per role × property. Each adapter
  // diffs against the baseline scope it covers.
  const tokenBaseline: NormalizedSnapshot = normalizeResolved(rt, { includeComponents: false });
  const fullBaseline: NormalizedSnapshot = normalizeResolved(rt, { includeComponents: true });

  const web = parseCssVars(toCssVariables(rt));
  const dart = parseDart(transformToDart(theme, { mode, className: "Probe" }));
  const swift = parseSwift(transformToSwift(theme, { mode, enumName: "Probe" }));
  const kotlin = parseKotlin(transformToKotlin(theme, { mode, objectName: "Probe" }));

  return [
    { adapter: "web-css", mismatches: diffSnapshots(tokenBaseline, web) },
    { adapter: "dart", mismatches: diffSnapshots(fullBaseline, dart) },
    { adapter: "swift", mismatches: diffSnapshots(fullBaseline, swift) },
    { adapter: "kotlin", mismatches: diffSnapshots(fullBaseline, kotlin) },
  ];
}

/**
 * Throws a readable error listing the divergent token names per adapter when any adapter
 * disagrees with the baseline. For use in CI / conformance test suites — same shape as
 * `assertConforms`.
 */
export function assertRuntimeParity(theme: unknown, mode: ThemeMode, label = "theme"): void {
  const results = checkRuntimeParity(theme, mode);
  const failing = results.filter((r) => r.mismatches.length > 0);
  if (failing.length === 0) return;
  const detail = failing
    .map(
      (r) =>
        `  ${r.adapter}: ${r.mismatches.length} mismatches\n` +
        r.mismatches
          .slice(0, 5)
          .map((m) => `    - ${m.name}: baseline=${JSON.stringify(m.left)} got=${JSON.stringify(m.right)}`)
          .join("\n"),
    )
    .join("\n");
  throw new Error(`${label}[${mode}] runtime parity failed:\n${detail}`);
}
