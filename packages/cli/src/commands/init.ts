// `polymorph init` — scaffold a minimal valid theme JSON from the live manifest.
//
// We synthesise rather than ship a baked-in JSON so `init` always produces a theme that
// matches the current contractVersion + token set, including any required tokens the user
// might have missed if they were copy-pasting an older example.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { TOKENS, CONTRACT_VERSION, type ThemeMode } from "@polymorph/spec";

type Json = Record<string, unknown>;

function sampleValueFor(type: string): unknown {
  switch (type) {
    case "color":
      return "#1f2933";
    case "dimension":
      return { value: 8, unit: "px" };
    case "duration":
      return { value: 200, unit: "ms" };
    case "number":
      return 0.5;
    case "cubicBezier":
      return [0.4, 0, 0.2, 1];
    case "typography":
      return {
        fontFamily: "Inter",
        fontWeight: 400,
        fontSize: { value: 16, unit: "px" },
        lineHeight: 1.5,
        letterSpacing: { value: 0, unit: "px" },
      };
    case "shadow":
      return {
        color: "#00000022",
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 1, unit: "px" },
        blur: { value: 2, unit: "px" },
        spread: { value: 0, unit: "px" },
      };
    default:
      throw new Error(`no sample value for type ${type}`);
  }
}

function setPath(root: Json, segs: string[], leaf: unknown): void {
  let cur = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]!;
    if (typeof cur[seg] !== "object" || cur[seg] === null) cur[seg] = {};
    cur = cur[seg] as Json;
  }
  cur[segs[segs.length - 1]!] = leaf;
}

const token = (type: string) => ({ $type: type, $value: sampleValueFor(type) });

/**
 * Build a minimal theme that satisfies the contract: every required token is present (with
 * a placeholder value), every required mode-sensitive token lives under `pm.modes.light`.
 * No optional tokens. The placeholder colours are intentionally identical (`#1f2933`) so
 * the lint warns visibly — that's the signal for "go customise this".
 */
export function buildMinimalTheme(modes: ThemeMode[] = ["light"]): unknown {
  const theme: Json = { contractVersion: CONTRACT_VERSION, pm: {} };
  const pm = theme.pm as Json;
  const modesObj: Json = {};
  pm.modes = modesObj;
  for (const mode of modes) modesObj[mode] = {};

  for (const t of TOKENS) {
    if (!t.required) continue;
    const tail = t.id.replace(/^pm\./, "").split(".");
    if (t.modeSensitive) {
      for (const mode of modes) {
        setPath(modesObj[mode] as Json, tail, token(t.type));
      }
    } else {
      setPath(pm, tail, token(t.type));
    }
  }
  return theme;
}

export interface InitOpts {
  output?: string;
  modes?: ThemeMode[];
  /** Pretty-print indent. Defaults to 2; use 0 for minified. */
  indent?: number;
}

export function runInit(opts: InitOpts): { exitCode: number; stdout?: string } {
  const theme = buildMinimalTheme(opts.modes ?? ["light"]);
  const indent = opts.indent ?? 2;
  const serialized = JSON.stringify(theme, null, indent) + "\n";
  if (opts.output) {
    mkdirSync(dirname(opts.output), { recursive: true });
    writeFileSync(opts.output, serialized);
    console.log(
      `✓ wrote ${opts.output} (${serialized.length} bytes, contractVersion ${CONTRACT_VERSION})`,
    );
    return { exitCode: 0 };
  }
  return { exitCode: 0, stdout: serialized };
}
