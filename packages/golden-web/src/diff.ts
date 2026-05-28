import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export interface DiffResult {
  match: boolean;
  diffRatio: number;
  /** Pixel-diff PNG bytes, if the diff exceeded the threshold. */
  diffPng?: Buffer;
}

/**
 * Compare two PNG buffers. Returns `{match, diffRatio}` where `diffRatio` is the fraction of
 * pixels that differ above pixelmatch's per-pixel threshold (default 0.1). The overall match
 * threshold defaults to **0.001** (0.1% of pixels).
 */
export function diffPngs(actual: Buffer, baseline: Buffer, threshold = 0.001): DiffResult {
  const a = PNG.sync.read(actual);
  const b = PNG.sync.read(baseline);
  if (a.width !== b.width || a.height !== b.height) {
    return { match: false, diffRatio: 1 };
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  const total = a.width * a.height;
  const ratio = total === 0 ? 0 : diffPixels / total;
  const match = ratio <= threshold;
  return match ? { match: true, diffRatio: ratio } : { match: false, diffRatio: ratio, diffPng: PNG.sync.write(diff) };
}
