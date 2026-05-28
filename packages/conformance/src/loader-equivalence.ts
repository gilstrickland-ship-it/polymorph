import { InlineLoader, BundledLoader, RemoteManifestLoader } from "@polymorph/loaders";
import type { ThemeMode } from "@polymorph/spec";
import type { ConformanceCheck } from "./checks.js";

/** All three reference loaders must resolve the same theme to a deep-equal ResolvedTheme. */
export async function checkLoaderEquivalence(theme: unknown, mode: ThemeMode = "light"): Promise<ConformanceCheck> {
  const json = JSON.stringify(theme);
  const inline = await new InlineLoader(theme).load();
  const bundled = await new BundledLoader(theme).load();
  const remote = await new RemoteManifestLoader({
    url: "https://conformance.local/theme.json",
    fetch: async () => ({ ok: true, status: 200, text: async () => json }),
  }).load();

  const a = JSON.stringify(inline.resolve(mode));
  const b = JSON.stringify(bundled.resolve(mode));
  const c = JSON.stringify(remote.resolve(mode));
  const passed = a === b && a === c;
  return passed
    ? { name: `loader equivalence [${mode}]`, passed }
    : { name: `loader equivalence [${mode}]`, passed, detail: "Inline/Bundled/RemoteManifest disagree" };
}
