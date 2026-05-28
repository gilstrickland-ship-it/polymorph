import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  InlineLoader,
  BundledLoader,
  RemoteManifestLoader,
  ThemeValidationError,
  LoaderFetchError,
  LoaderParseError,
  type FetchLike,
} from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const theme = JSON.parse(
  readFileSync(join(here, "..", "..", "spec", "tests", "fixtures", "valid", "light-dark.tokens.json"), "utf8"),
);
const themeJson = JSON.stringify(theme);

const okFetch = (body: string): { fetch: FetchLike; calls: () => number } => {
  let calls = 0;
  return {
    calls: () => calls,
    fetch: async () => {
      calls++;
      return { ok: true, status: 200, text: async () => body };
    },
  };
};

describe("loader equivalence (SC-004)", () => {
  it("Inline, Bundled, and RemoteManifest produce a deep-equal ResolvedTheme", async () => {
    const inline = await new InlineLoader(theme).load();
    const bundled = await new BundledLoader(theme).load();
    const remote = await new RemoteManifestLoader({ url: "https://x/theme.json", fetch: okFetch(themeJson).fetch }).load();

    expect(bundled.resolve("light")).toEqual(inline.resolve("light"));
    expect(remote.resolve("light")).toEqual(inline.resolve("light"));
    expect(remote.resolve("dark")).toEqual(inline.resolve("dark"));
    expect(inline.modes).toEqual(["light", "dark"]);
  });
});

describe("RemoteManifestLoader", () => {
  it("caches the validated theme (second load does not refetch)", async () => {
    const f = okFetch(themeJson);
    const loader = new RemoteManifestLoader({ url: "https://x/theme.json", fetch: f.fetch });
    await loader.load();
    await loader.load();
    expect(f.calls()).toBe(1);
  });

  it("surfaces a typed error on non-2xx", async () => {
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: async () => ({ ok: false, status: 503, text: async () => "" }),
    });
    await expect(loader.load()).rejects.toBeInstanceOf(LoaderFetchError);
  });

  it("surfaces a typed error on malformed JSON", async () => {
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: async () => ({ ok: true, status: 200, text: async () => "not json" }),
    });
    await expect(loader.load()).rejects.toBeInstanceOf(LoaderParseError);
  });

  it("surfaces a validation error for a schema-invalid remote theme", async () => {
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ pm: {} }) }),
    });
    await expect(loader.load()).rejects.toBeInstanceOf(ThemeValidationError);
  });
});
