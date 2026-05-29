import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { run } from "../src/run.js";
import { validateTheme } from "@polymorph/core";
import { buildMinimalTheme } from "../src/commands/init.js";
import { diffThemes } from "../src/commands/diff.js";
import { migrateTheme } from "../src/commands/migrate.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");

let logs: string[];
let errs: string[];
let stdoutBuf: string[];
let originalWrite: typeof process.stdout.write;

beforeEach(() => {
  logs = [];
  errs = [];
  stdoutBuf = [];
  vi.spyOn(console, "log").mockImplementation((...a) => void logs.push(a.join(" ")));
  vi.spyOn(console, "error").mockImplementation((...a) => void errs.push(a.join(" ")));
  originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdoutBuf.push(typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk));
    return true;
  }) as typeof process.stdout.write;
});
afterEach(() => {
  vi.restoreAllMocks();
  process.stdout.write = originalWrite;
});

describe("buildMinimalTheme (unit)", () => {
  it("produces a theme that passes validateTheme", () => {
    const theme = buildMinimalTheme(["light"]);
    expect(validateTheme(theme).valid).toBe(true);
  });

  it("populates every declared mode with the required mode-sensitive set", () => {
    const theme = buildMinimalTheme(["light", "dark"]) as { pm: { modes: Record<string, unknown> } };
    expect(theme.pm.modes).toHaveProperty("light");
    expect(theme.pm.modes).toHaveProperty("dark");
    expect(validateTheme(theme).valid).toBe(true);
  });
});

describe("polymorph init", () => {
  it("writes a valid theme to --output and reports the byte count", async () => {
    const dir = mkdtempSync(join(tmpdir(), "polymorph-init-"));
    const out = join(dir, "theme.tokens.json");
    try {
      const code = await run(["init", "--output", out]);
      expect(code).toBe(0);
      expect(logs.join("\n")).toMatch(/wrote .*\.tokens\.json/);
      const written = JSON.parse(readFileSync(out, "utf8"));
      expect(validateTheme(written).valid).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("prints to stdout when --output is omitted", async () => {
    const code = await run(["init"]);
    expect(code).toBe(0);
    const out = stdoutBuf.join("");
    const parsed = JSON.parse(out);
    expect(validateTheme(parsed).valid).toBe(true);
  });

  it("honours --modes (light,dark) and emits both", async () => {
    await run(["init", "--modes", "light,dark"]);
    const parsed = JSON.parse(stdoutBuf.join(""));
    expect(parsed.pm.modes).toHaveProperty("light");
    expect(parsed.pm.modes).toHaveProperty("dark");
  });
});

describe("diffThemes (unit)", () => {
  it("returns empty for identical themes", () => {
    const a = buildMinimalTheme(["light"]);
    expect(diffThemes(a, a).entries).toEqual([]);
  });

  it("classifies added / removed / changed paths", () => {
    // We mutate the deep tree via JSON round-trip + ad-hoc `any` casts here — it's a test
    // fixture, not production code, and the assertions afterwards prove the mutation took.
    const a = buildMinimalTheme(["light"]);
    const b = JSON.parse(JSON.stringify(a));
    const lightColor: any = b.pm.modes.light.color;
    lightColor.surface.base.$value = "#abcdef"; // change
    delete lightColor.text.body; // remove
    b.pm.someNewOptional = { $type: "number", $value: 0.5 }; // add (under pm.* root)

    const diff = diffThemes(a, b);
    const kinds = diff.entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.kind] = (acc[e.kind] ?? 0) + 1;
      return acc;
    }, {});
    expect(kinds.added).toBeGreaterThanOrEqual(1);
    expect(kinds.removed).toBeGreaterThanOrEqual(1);
    expect(kinds.changed).toBeGreaterThanOrEqual(1);
    expect(diff.entries.every((e) => typeof e.path === "string")).toBe(true);
  });
});

describe("polymorph diff", () => {
  it("exit 0 + summary when both files match", async () => {
    const dir = mkdtempSync(join(tmpdir(), "polymorph-diff-"));
    try {
      const a = join(dir, "a.json");
      const b = join(dir, "b.json");
      const theme = JSON.stringify(buildMinimalTheme(["light"]));
      writeFileSync(a, theme);
      writeFileSync(b, theme);
      const code = await run(["diff", a, b]);
      expect(code).toBe(0);
      expect(logs.join("\n")).toContain("identical");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("exit 1 + change list when themes differ", async () => {
    const dir = mkdtempSync(join(tmpdir(), "polymorph-diff-"));
    try {
      const a = join(dir, "a.json");
      const b = join(dir, "b.json");
      const theme = buildMinimalTheme(["light"]);
      writeFileSync(a, JSON.stringify(theme));
      const themeB: any = JSON.parse(JSON.stringify(theme));
      themeB.pm.modes.light.color.surface.base.$value = "#feedbc";
      writeFileSync(b, JSON.stringify(themeB));
      const code = await run(["diff", a, b]);
      expect(code).toBe(1);
      expect(logs.join("\n")).toMatch(/~ modes\.light\.color\.surface\.base/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("migrateTheme (unit)", () => {
  it("fills in missing required tokens and bumps contractVersion", () => {
    const minimal: any = buildMinimalTheme(["light"]);
    delete minimal.pm.motion.duration.reduced;
    minimal.contractVersion = "0.0.0";

    const { migrated, report } = migrateTheme(minimal);
    expect(report.addedTokens.some((a) => a.id === "pm.motion.duration.reduced")).toBe(true);
    expect(report.unchanged).toBe(false);
    expect(validateTheme(migrated).valid).toBe(true);
  });

  it("reports unchanged when nothing needs adding", () => {
    const minimal = buildMinimalTheme(["light"]);
    const { report } = migrateTheme(minimal);
    expect(report.unchanged).toBe(true);
    expect(report.addedTokens).toEqual([]);
  });

  it("fills mode-sensitive tokens across every declared mode", () => {
    const minimal: any = buildMinimalTheme(["light", "dark"]);
    delete minimal.pm.modes.light.color.surface.base;
    delete minimal.pm.modes.dark.color.surface.base;
    const { report, migrated } = migrateTheme(minimal);
    const filled = report.addedTokens.find((a) => a.id === "pm.color.surface.base");
    expect(filled?.modes).toEqual(["light", "dark"]);
    expect(validateTheme(migrated).valid).toBe(true);
  });
});

describe("polymorph migrate", () => {
  it("--output writes the migrated theme", async () => {
    const dir = mkdtempSync(join(tmpdir(), "polymorph-migrate-"));
    try {
      const inPath = join(dir, "in.json");
      const outPath = join(dir, "out.json");
      const minimal: any = buildMinimalTheme(["light"]);
      delete minimal.pm.motion.duration.reduced;
      writeFileSync(inPath, JSON.stringify(minimal));
      const code = await run(["migrate", inPath, "--output", outPath]);
      expect(code).toBe(0);
      const written = JSON.parse(readFileSync(outPath, "utf8"));
      expect(validateTheme(written).valid).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("--json emits the migration report as JSON", async () => {
    const dir = mkdtempSync(join(tmpdir(), "polymorph-migrate-"));
    try {
      const inPath = join(dir, "in.json");
      writeFileSync(inPath, JSON.stringify(buildMinimalTheme(["light"])));
      const code = await run(["migrate", inPath, "--json"]);
      expect(code).toBe(0);
      const parsed = JSON.parse(logs.join("\n"));
      expect(parsed).toHaveProperty("fromVersion");
      expect(parsed).toHaveProperty("toVersion");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
