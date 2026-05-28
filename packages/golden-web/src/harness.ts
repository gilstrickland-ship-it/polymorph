import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { GoldenHarness } from "@polymorph/conformance";
import type { ThemeMode } from "@polymorph/spec";
import { renderScenarioToPng } from "./render.js";
import { diffPngs } from "./diff.js";
import type { WebGoldenScenario } from "./scenarios.js";

/** Payload `WebGoldenHarness.capture` accepts (the `tree` arg of `GoldenHarness.capture`). */
export interface WebGoldenPayload {
  scenario: WebGoldenScenario;
  /** A theme JSON (un-resolved). */
  theme: unknown;
  /** Defaults to `"light"`. */
  mode?: ThemeMode;
}

export interface WebHarnessOptions {
  /** Directory holding baseline PNGs. Files are named `${name}.png`. */
  baselineDir: string;
  /** If true, missing or mismatching baselines are (re)written rather than reported as failures. */
  update?: boolean;
  /** Pixel-diff threshold (fraction of pixels allowed to differ). Default 0.001. */
  threshold?: number;
}

/**
 * Build a `GoldenHarness` that captures via Satori → resvg (pure-Node, no browser binary) and
 * compares with pixelmatch against committed baseline PNGs. Implements
 * `@polymorph/conformance.GoldenHarness`.
 */
export function createWebGoldenHarness(opts: WebHarnessOptions): GoldenHarness {
  return {
    async capture(_name: string, tree: unknown): Promise<Uint8Array> {
      const p = tree as WebGoldenPayload;
      if (!p || !p.scenario || !p.theme) {
        throw new Error("createWebGoldenHarness.capture: expected a WebGoldenPayload { scenario, theme, mode? }");
      }
      return await renderScenarioToPng(p.scenario, p.theme, p.mode ?? "light");
    },
    async compare(name: string, actual: Uint8Array): Promise<{ match: boolean; diffRatio: number }> {
      const path = join(opts.baselineDir, `${name}.png`);
      const actualBuf = Buffer.from(actual);
      if (!existsSync(path)) {
        if (opts.update) {
          mkdirSync(dirname(path), { recursive: true });
          writeFileSync(path, actualBuf);
          return { match: true, diffRatio: 0 };
        }
        return { match: false, diffRatio: 1 };
      }
      const baseline = readFileSync(path);
      const result = diffPngs(actualBuf, baseline, opts.threshold ?? 0.001);
      if (!result.match && opts.update) {
        writeFileSync(path, actualBuf);
        return { match: true, diffRatio: result.diffRatio };
      }
      return { match: result.match, diffRatio: result.diffRatio };
    },
  };
}
