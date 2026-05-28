import {
  makeLoadedTheme,
  LoaderFetchError,
  LoaderParseError,
  type LoadedTheme,
  type ThemeLoader,
} from "./theme-loader.js";

/** Minimal fetch shape — avoids depending on DOM lib types and is trivial to stub in tests. */
export type FetchLike = (url: string) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export interface RemoteManifestOptions {
  url: string;
  /** Defaults to global `fetch`. Inject for tests. */
  fetch?: FetchLike;
  /** If set, a cached theme older than this is refetched. Omit to cache for the loader's life. */
  cacheTtlMs?: number;
}

/**
 * Fetches a versioned theme JSON over HTTP, validates it, and caches the validated theme in
 * memory. Integrity/signature verification is out of scope for v1 (roadmap).
 */
export class RemoteManifestLoader implements ThemeLoader {
  private cache?: { theme: unknown; at: number };

  constructor(private readonly opts: RemoteManifestOptions) {}

  async load(): Promise<LoadedTheme> {
    const fresh =
      this.cache &&
      (this.opts.cacheTtlMs === undefined || Date.now() - this.cache.at < this.opts.cacheTtlMs);
    if (this.cache && fresh) return makeLoadedTheme(this.cache.theme);

    const doFetch = this.opts.fetch ?? (globalThis.fetch as unknown as FetchLike | undefined);
    if (!doFetch) throw new LoaderFetchError("no fetch implementation available");

    let res: Awaited<ReturnType<FetchLike>>;
    try {
      res = await doFetch(this.opts.url);
    } catch (e) {
      throw new LoaderFetchError(`fetch failed for ${this.opts.url}: ${(e as Error).message}`);
    }
    if (!res.ok) {
      throw new LoaderFetchError(`unexpected status ${res.status} for ${this.opts.url}`, res.status);
    }

    let json: unknown;
    try {
      json = JSON.parse(await res.text());
    } catch {
      throw new LoaderParseError(`invalid JSON from ${this.opts.url}`);
    }

    const loaded = makeLoadedTheme(json); // throws ThemeValidationError on invalid theme
    this.cache = { theme: json, at: Date.now() };
    return loaded;
  }
}
