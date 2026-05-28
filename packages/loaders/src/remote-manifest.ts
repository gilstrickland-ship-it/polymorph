import {
  makeLoadedTheme,
  LoaderFetchError,
  LoaderParseError,
  type LoadedTheme,
  type ThemeLoader,
} from "./theme-loader.js";
import { computeIntegrity, verifyIntegrity } from "./integrity.js";
import { verifyEd25519, type Ed25519PublicKey } from "./signature.js";

/**
 * Minimal fetch shape — narrow enough to stub in tests, wide enough to carry the headers
 * needed for ETag-conditional requests and signature side-channel fetches. `init.headers`
 * lets the loader send `If-None-Match`; the response's optional `headers.get(name)` lets the
 * loader read `ETag`. Both fields are optional so the existing test stubs still type-check.
 */
export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
  headers?: { get(name: string): string | null };
}>;

/**
 * Audit event emitted by the loader on every meaningful state transition. Pluggable —
 * orgs route this into their SIEM, structured log, OpenTelemetry pipeline, whatever. The
 * loader emits but does not interpret.
 */
export type RemoteManifestEvent =
  | { kind: "fetch-start"; url: string; at: number; conditional: boolean }
  | { kind: "cache-hit"; url: string; at: number; ageMs: number }
  | { kind: "not-modified"; url: string; at: number; etag?: string }
  | {
      kind: "fetched";
      url: string;
      at: number;
      status: number;
      bytes: number;
      etag?: string;
      hash: string;
    }
  | {
      kind: "verify-success";
      url: string;
      at: number;
      method: "integrity" | "signature" | "version";
      detail?: string;
    }
  | {
      kind: "verify-failure";
      url: string;
      at: number;
      method: "integrity" | "signature" | "version";
      reason: string;
    }
  | { kind: "rollback"; url: string; at: number; fromHash: string; toHash: string }
  | { kind: "error"; url: string; at: number; error: string };

export class IntegrityVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrityVerificationError";
  }
}

export class SignatureVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SignatureVerificationError";
  }
}

export class ContractVersionMismatchError extends Error {
  expected: string;
  actual: string;
  constructor(expected: string, actual: string) {
    super(`contract version mismatch: expected ${expected}, got ${actual}`);
    this.name = "ContractVersionMismatchError";
    this.expected = expected;
    this.actual = actual;
  }
}

export interface RemoteManifestOptions {
  url: string;
  /** Defaults to global `fetch`. Inject for tests. */
  fetch?: FetchLike;
  /** If set, a cached theme older than this is refetched. Omit to cache for the loader's life. */
  cacheTtlMs?: number;

  /**
   * Expected SRI-style integrity hash, e.g. `"sha384-…"`. If set, the loader refuses any
   * payload that doesn't match — fails closed unless `rollbackOnVerifyFailure` rescues.
   */
  integrity?: string;

  /**
   * Ed25519 public keys the loader trusts (typically 1; 2-3 during rotation). If set, the
   * loader requires a valid detached signature fetched from `signatureUrl`.
   */
  signatureKeys?: Ed25519PublicKey[];
  /** URL of the detached signature blob. Defaults to `${url}.sig`. */
  signatureUrl?: string;

  /** Pin to an exact `contractVersion`. Rejects any mismatch. */
  expectedContractVersion?: string;

  /**
   * Fail-closed-with-grace: on integrity/signature/version verification failure, surface the
   * last-known-good theme (if any) and emit `rollback` instead of throwing. If no prior good
   * theme exists, the verification error still throws.
   */
  rollbackOnVerifyFailure?: boolean;

  /** Audit hook — invoked synchronously on every state transition. */
  onEvent?: (event: RemoteManifestEvent) => void;
}

interface CachedEntry {
  theme: unknown;
  loaded: LoadedTheme;
  at: number;
  etag?: string;
  hash: string;
}

/**
 * Fetches a versioned theme JSON over HTTP, validates it, and caches the validated theme in
 * memory. Optional governance: SRI integrity, Ed25519 detached signature, contract-version
 * pin, ETag-conditional refresh, fail-closed-with-rollback, and a pluggable audit hook.
 *
 * Verification order on each refresh: integrity → signature → schema validation → version
 * pin. Any failure either throws (default) or rolls back to the last good theme
 * (`rollbackOnVerifyFailure: true`).
 */
export class RemoteManifestLoader implements ThemeLoader {
  private cache?: CachedEntry;

  constructor(private readonly opts: RemoteManifestOptions) {}

  private emit(event: RemoteManifestEvent): void {
    try {
      this.opts.onEvent?.(event);
    } catch {
      // The audit hook is the caller's code; we never let it break the load.
    }
  }

  async load(): Promise<LoadedTheme> {
    const now = Date.now();
    const ttl = this.opts.cacheTtlMs;
    const fresh = this.cache && (ttl === undefined || now - this.cache.at < ttl);
    if (this.cache && fresh) {
      this.emit({ kind: "cache-hit", url: this.opts.url, at: now, ageMs: now - this.cache.at });
      return this.cache.loaded;
    }

    const doFetch = this.opts.fetch ?? (globalThis.fetch as unknown as FetchLike | undefined);
    if (!doFetch) {
      const err = "no fetch implementation available";
      this.emit({ kind: "error", url: this.opts.url, at: now, error: err });
      throw new LoaderFetchError(err);
    }

    const conditional = this.cache?.etag !== undefined;
    this.emit({ kind: "fetch-start", url: this.opts.url, at: now, conditional });

    const init = conditional ? { headers: { "If-None-Match": this.cache!.etag! } } : undefined;
    let res: Awaited<ReturnType<FetchLike>>;
    try {
      res = await doFetch(this.opts.url, init);
    } catch (e) {
      const msg = `fetch failed for ${this.opts.url}: ${(e as Error).message}`;
      this.emit({ kind: "error", url: this.opts.url, at: Date.now(), error: msg });
      throw new LoaderFetchError(msg);
    }

    if (res.status === 304 && this.cache) {
      this.cache.at = Date.now();
      this.emit({
        kind: "not-modified",
        url: this.opts.url,
        at: this.cache.at,
        etag: this.cache.etag,
      });
      return this.cache.loaded;
    }

    if (!res.ok) {
      const msg = `unexpected status ${res.status} for ${this.opts.url}`;
      this.emit({ kind: "error", url: this.opts.url, at: Date.now(), error: msg });
      throw new LoaderFetchError(msg, res.status);
    }

    const bodyText = await res.text();
    const bodyBytes = new TextEncoder().encode(bodyText);
    const etag = res.headers?.get("ETag") ?? undefined;
    const hash = await computeIntegrity(bodyBytes, "sha384");

    this.emit({
      kind: "fetched",
      url: this.opts.url,
      at: Date.now(),
      status: res.status,
      bytes: bodyBytes.length,
      etag,
      hash,
    });

    // 1) Integrity check (cheap — hash already computed).
    if (this.opts.integrity) {
      const ok = await verifyIntegrity(bodyBytes, this.opts.integrity);
      if (!ok) {
        return this.handleVerifyFailure("integrity", `expected ${this.opts.integrity}, got ${hash}`, hash);
      }
      this.emit({
        kind: "verify-success",
        url: this.opts.url,
        at: Date.now(),
        method: "integrity",
        detail: this.opts.integrity,
      });
    }

    // 2) Signature verification (requires side-channel fetch of the .sig blob).
    if (this.opts.signatureKeys && this.opts.signatureKeys.length > 0) {
      const sigUrl = this.opts.signatureUrl ?? `${this.opts.url}.sig`;
      let sigBytes: Uint8Array;
      try {
        const sigRes = await doFetch(sigUrl);
        if (!sigRes.ok) {
          return this.handleVerifyFailure("signature", `signature fetch ${sigUrl} returned ${sigRes.status}`, hash);
        }
        sigBytes = decodeSignature(await sigRes.text());
      } catch (e) {
        return this.handleVerifyFailure("signature", `signature fetch failed: ${(e as Error).message}`, hash);
      }
      const matched = await verifyEd25519(bodyBytes, sigBytes, this.opts.signatureKeys);
      if (matched === null) {
        return this.handleVerifyFailure("signature", "no trusted key validated the signature", hash);
      }
      this.emit({
        kind: "verify-success",
        url: this.opts.url,
        at: Date.now(),
        method: "signature",
        detail: `key #${matched}`,
      });
    }

    // 3) Parse + schema validate.
    let json: unknown;
    try {
      json = JSON.parse(bodyText);
    } catch {
      const msg = `invalid JSON from ${this.opts.url}`;
      this.emit({ kind: "error", url: this.opts.url, at: Date.now(), error: msg });
      throw new LoaderParseError(msg);
    }

    let loaded: LoadedTheme;
    try {
      loaded = makeLoadedTheme(json);
    } catch (e) {
      // Validation errors are NOT verification failures — they're a structural bug in the
      // payload. Propagate, never rollback. (Rollback exists for an attacker substituting a
      // valid-shaped theme; an invalid-shaped one is its own loud signal.)
      this.emit({ kind: "error", url: this.opts.url, at: Date.now(), error: (e as Error).message });
      throw e;
    }

    // 4) Version pin (after validate so `loaded.contractVersion` is trustworthy).
    if (this.opts.expectedContractVersion && loaded.contractVersion !== this.opts.expectedContractVersion) {
      return this.handleVerifyFailure(
        "version",
        `expected ${this.opts.expectedContractVersion}, got ${loaded.contractVersion}`,
        hash,
      );
    }
    if (this.opts.expectedContractVersion) {
      this.emit({
        kind: "verify-success",
        url: this.opts.url,
        at: Date.now(),
        method: "version",
        detail: loaded.contractVersion,
      });
    }

    this.cache = { theme: json, loaded, at: Date.now(), etag, hash };
    return loaded;
  }

  private handleVerifyFailure(
    method: "integrity" | "signature" | "version",
    reason: string,
    hash: string,
  ): LoadedTheme {
    this.emit({
      kind: "verify-failure",
      url: this.opts.url,
      at: Date.now(),
      method,
      reason,
    });
    if (this.opts.rollbackOnVerifyFailure && this.cache) {
      this.emit({
        kind: "rollback",
        url: this.opts.url,
        at: Date.now(),
        fromHash: hash,
        toHash: this.cache.hash,
      });
      return this.cache.loaded;
    }
    if (method === "integrity") throw new IntegrityVerificationError(reason);
    if (method === "signature") throw new SignatureVerificationError(reason);
    const [exp, act] = reason.replace(/^expected /, "").split(", got ");
    throw new ContractVersionMismatchError(exp ?? "?", act ?? "?");
  }
}

/**
 * Accept the `.sig` blob in either base64 (compact, single-line) or raw bytes. Raw isn't
 * great for HTTP transport (binary in a text/plain response is ambiguous); base64 is the
 * dominant pattern in the wild.
 */
function decodeSignature(text: string): Uint8Array {
  const trimmed = text.trim();
  const bin = atob(trimmed);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
