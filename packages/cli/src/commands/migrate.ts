// `polymorph migrate` — bring a theme up to the current contract.
//
// Today, "migration" means: fill in any required tokens introduced since the theme was
// authored, and bump `contractVersion` to the current value. We don't need a
// contract-version-aware migration map yet (we're still at 0.0.0 + additive changes), but
// the surface is shaped so future migrations slot in here when the contract bumps.
//
// The pass is conservative — only ADDS missing required tokens with placeholder values
// (same logic as `init`). It never rewrites the user's authored values and never removes
// tokens, even if the manifest no longer lists them. Removal is the FI's call, not ours.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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

function getPath(root: unknown, segs: string[]): unknown {
  let cur = root;
  for (const seg of segs) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Json)[seg];
  }
  return cur;
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

export interface MigrationReport {
  fromVersion: string;
  toVersion: string;
  addedTokens: { id: string; modes?: ThemeMode[] }[];
  unchanged: boolean;
}

export function migrateTheme(theme: unknown): { migrated: unknown; report: MigrationReport } {
  const obj = JSON.parse(JSON.stringify(theme)) as Json;
  const fromVersion = (obj.contractVersion as string | undefined) ?? "0.0.0";
  const pm = ((obj.pm ??= {}) as Json);
  const modesObj = ((pm.modes ??= {}) as Json);

  // Determine which modes the theme already declares; mode-sensitive tokens are added under
  // every declared mode (so a `dark`-using theme keeps its dark companion of any newly
  // required token).
  const declaredModes: ThemeMode[] = (Object.keys(modesObj) as ThemeMode[]).filter((m) =>
    ["light", "dark", "highContrast"].includes(m),
  );
  if (declaredModes.length === 0) declaredModes.push("light");

  const added: MigrationReport["addedTokens"] = [];
  for (const t of TOKENS) {
    if (!t.required) continue;
    const tail = t.id.replace(/^pm\./, "").split(".");
    if (t.modeSensitive) {
      const fillModes: ThemeMode[] = [];
      for (const mode of declaredModes) {
        if (getPath(modesObj[mode], tail) === undefined) {
          setPath(modesObj[mode] as Json, tail, { $type: t.type, $value: sampleValueFor(t.type) });
          fillModes.push(mode);
        }
      }
      if (fillModes.length > 0) added.push({ id: t.id, modes: fillModes });
    } else {
      if (getPath(pm, tail) === undefined) {
        setPath(pm, tail, { $type: t.type, $value: sampleValueFor(t.type) });
        added.push({ id: t.id });
      }
    }
  }

  obj.contractVersion = CONTRACT_VERSION;
  return {
    migrated: obj,
    report: {
      fromVersion,
      toVersion: CONTRACT_VERSION,
      addedTokens: added,
      unchanged: added.length === 0 && fromVersion === CONTRACT_VERSION,
    },
  };
}

export interface MigrateOpts {
  inputPath: string;
  output?: string;
  json?: boolean;
}

export function runMigrate(opts: MigrateOpts): { exitCode: number } {
  let theme: unknown;
  try {
    theme = JSON.parse(readFileSync(opts.inputPath, "utf8"));
  } catch (e) {
    console.error(`error: cannot read/parse ${opts.inputPath}: ${(e as Error).message}`);
    return { exitCode: 2 };
  }
  const { migrated, report } = migrateTheme(theme);
  const serialized = JSON.stringify(migrated, null, 2) + "\n";

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (report.unchanged) {
    console.log(`✓ already at contractVersion ${report.toVersion} — no migration needed`);
  } else {
    console.log(`migrating ${opts.inputPath} from ${report.fromVersion} → ${report.toVersion}`);
    for (const a of report.addedTokens) {
      const where = a.modes ? ` (modes: ${a.modes.join(", ")})` : " (invariant)";
      console.log(`  + ${a.id}${where}`);
    }
  }

  if (opts.output) {
    mkdirSync(dirname(opts.output), { recursive: true });
    writeFileSync(opts.output, serialized);
    if (!opts.json) console.log(`✓ wrote ${opts.output} (${serialized.length} bytes)`);
  } else if (!opts.json && !report.unchanged) {
    console.log("\nrerun with --output <path> to write the migrated file.");
  }
  return { exitCode: 0 };
}
