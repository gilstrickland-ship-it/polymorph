import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const filesDir = join(dirname(require.resolve("@fontsource/inter/package.json")), "files");

const regular = readFileSync(join(filesDir, "inter-latin-400-normal.woff"));
const bold = readFileSync(join(filesDir, "inter-latin-700-normal.woff"));

/**
 * Fonts handed to Satori for deterministic rendering across platforms. We always use Inter for
 * the golden harness — the theme's `pm.typography.*.fontFamily` is ignored here so font fidelity
 * is not part of the diff. (Colors, radii, spacing, and layout are.)
 */
export const SATORI_FONTS = [
  { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
];
