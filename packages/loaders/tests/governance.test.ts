import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateKeyPairSync, sign as nodeSign, webcrypto } from "node:crypto";
import {
  RemoteManifestLoader,
  IntegrityVerificationError,
  SignatureVerificationError,
  ContractVersionMismatchError,
  ThemeValidationError,
  computeIntegrity,
  type FetchLike,
  type RemoteManifestEvent,
} from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const theme = JSON.parse(
  readFileSync(join(here, "..", "..", "spec", "tests", "fixtures", "valid", "light-dark.tokens.json"), "utf8"),
);
const themeJson = JSON.stringify(theme);
const themeBytes = new TextEncoder().encode(themeJson);

// One importable ed25519 keypair shared across the signature tests. We generate it with
// Node's `crypto` (universal, no key-file gymnastics in CI), export the public half as SPKI,
// then re-import via SubtleCrypto so the loader sees a real CryptoKey just like a browser caller would.
let signKeyPem: string;
let publicKey: webcrypto.CryptoKey;
let publicKey2: webcrypto.CryptoKey;

beforeAll(async () => {
  const kp = generateKeyPairSync("ed25519");
  signKeyPem = kp.privateKey.export({ format: "pem", type: "pkcs8" }) as string;
  const spki = new Uint8Array(kp.publicKey.export({ format: "der", type: "spki" }) as Buffer);
  publicKey = await webcrypto.subtle.importKey("spki", spki, { name: "Ed25519" }, false, ["verify"]);

  // A second, unrelated key — used to prove unrelated keys don't accept a foreign signature.
  const other = generateKeyPairSync("ed25519");
  const otherSpki = new Uint8Array(other.publicKey.export({ format: "der", type: "spki" }) as Buffer);
  publicKey2 = await webcrypto.subtle.importKey("spki", otherSpki, { name: "Ed25519" }, false, ["verify"]);
});

function signThemeBase64(bytes: Uint8Array): string {
  const sig = nodeSign(null, bytes, signKeyPem);
  return Buffer.from(sig).toString("base64");
}

interface Stub {
  fetch: FetchLike;
  calls: () => Array<{ url: string; init?: { headers?: Record<string, string> } }>;
}

function stubFetch(map: Record<string, { status: number; body: string; etag?: string }>): Stub {
  const calls: Array<{ url: string; init?: { headers?: Record<string, string> } }> = [];
  return {
    calls: () => calls,
    fetch: async (url, init) => {
      calls.push({ url, init });
      const entry = map[url];
      if (!entry) return { ok: false, status: 404, text: async () => "" };
      const ifNoneMatch = init?.headers?.["If-None-Match"];
      if (ifNoneMatch && entry.etag && ifNoneMatch === entry.etag) {
        return {
          ok: false,
          status: 304,
          text: async () => "",
          headers: { get: (n: string) => (n === "ETag" ? entry.etag! : null) },
        };
      }
      return {
        ok: entry.status >= 200 && entry.status < 300,
        status: entry.status,
        text: async () => entry.body,
        headers: { get: (n: string) => (n === "ETag" ? entry.etag ?? null : null) },
      };
    },
  };
}

describe("RemoteManifestLoader — integrity verification", () => {
  it("accepts a payload that matches the SRI hash", async () => {
    const integrity = await computeIntegrity(themeBytes, "sha384");
    const events: RemoteManifestEvent[] = [];
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: themeJson } }).fetch,
      integrity,
      onEvent: (e) => events.push(e),
    });
    await expect(loader.load()).resolves.toBeDefined();
    expect(events.some((e) => e.kind === "verify-success" && e.method === "integrity")).toBe(true);
  });

  it("rejects a tampered payload with IntegrityVerificationError", async () => {
    const integrity = await computeIntegrity(new TextEncoder().encode("different bytes"), "sha384");
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: themeJson } }).fetch,
      integrity,
    });
    await expect(loader.load()).rejects.toBeInstanceOf(IntegrityVerificationError);
  });

  it("emits verify-failure before throwing", async () => {
    const wrong = "sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const events: RemoteManifestEvent[] = [];
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: themeJson } }).fetch,
      integrity: wrong,
      onEvent: (e) => events.push(e),
    });
    await expect(loader.load()).rejects.toBeInstanceOf(IntegrityVerificationError);
    expect(events.some((e) => e.kind === "verify-failure" && e.method === "integrity")).toBe(true);
  });
});

describe("RemoteManifestLoader — signature verification", () => {
  it("accepts a payload signed by a trusted key", async () => {
    const sigB64 = signThemeBase64(themeBytes);
    const events: RemoteManifestEvent[] = [];
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({
        "https://x/theme.json": { status: 200, body: themeJson },
        "https://x/theme.json.sig": { status: 200, body: sigB64 },
      }).fetch,
      signatureKeys: [publicKey],
      onEvent: (e) => events.push(e),
    });
    await expect(loader.load()).resolves.toBeDefined();
    expect(events.some((e) => e.kind === "verify-success" && e.method === "signature")).toBe(true);
  });

  it("accepts a payload signed by ANY trusted key (rotation window)", async () => {
    const sigB64 = signThemeBase64(themeBytes);
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({
        "https://x/theme.json": { status: 200, body: themeJson },
        "https://x/theme.json.sig": { status: 200, body: sigB64 },
      }).fetch,
      // The trusted set has the wrong key FIRST, the right key SECOND — both rotations matter.
      signatureKeys: [publicKey2, publicKey],
    });
    await expect(loader.load()).resolves.toBeDefined();
  });

  it("rejects when no trusted key validates the signature", async () => {
    const sigB64 = signThemeBase64(themeBytes);
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({
        "https://x/theme.json": { status: 200, body: themeJson },
        "https://x/theme.json.sig": { status: 200, body: sigB64 },
      }).fetch,
      signatureKeys: [publicKey2],
    });
    await expect(loader.load()).rejects.toBeInstanceOf(SignatureVerificationError);
  });

  it("rejects when the signature blob is missing", async () => {
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: themeJson } }).fetch,
      signatureKeys: [publicKey],
    });
    await expect(loader.load()).rejects.toBeInstanceOf(SignatureVerificationError);
  });

  it("honours a custom signatureUrl", async () => {
    const sigB64 = signThemeBase64(themeBytes);
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      signatureUrl: "https://sigs.example/theme.sig",
      fetch: stubFetch({
        "https://x/theme.json": { status: 200, body: themeJson },
        "https://sigs.example/theme.sig": { status: 200, body: sigB64 },
      }).fetch,
      signatureKeys: [publicKey],
    });
    await expect(loader.load()).resolves.toBeDefined();
  });
});

describe("RemoteManifestLoader — version pinning", () => {
  it("accepts the expected contract version", async () => {
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: themeJson } }).fetch,
      expectedContractVersion: theme.contractVersion as string,
    });
    await expect(loader.load()).resolves.toBeDefined();
  });

  it("rejects an unexpected contract version with ContractVersionMismatchError", async () => {
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: themeJson } }).fetch,
      expectedContractVersion: "9.9.9",
    });
    await expect(loader.load()).rejects.toBeInstanceOf(ContractVersionMismatchError);
  });

  it("schema-invalid payloads still throw ThemeValidationError (NOT rollback territory)", async () => {
    const cached = await new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: themeJson } }).fetch,
    }).load();
    expect(cached.contractVersion).toBeDefined();
    // Same URL, now serves garbage. A schema-invalid payload is a structural bug — never rolled back.
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: JSON.stringify({ pm: {} }) } }).fetch,
      rollbackOnVerifyFailure: true,
    });
    await expect(loader.load()).rejects.toBeInstanceOf(ThemeValidationError);
  });
});

describe("RemoteManifestLoader — rollback (fail-closed-with-grace)", () => {
  it("rolls back to the last-known-good theme on integrity failure", async () => {
    const integrity = await computeIntegrity(themeBytes, "sha384");
    let body = themeJson;
    const events: RemoteManifestEvent[] = [];
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: async () => ({ ok: true, status: 200, text: async () => body }),
      integrity,
      cacheTtlMs: 0, // always refetch
      rollbackOnVerifyFailure: true,
      onEvent: (e) => events.push(e),
    });
    const first = await loader.load();
    // Now the server starts serving a tampered payload.
    body = JSON.stringify({ ...theme, contractVersion: "tampered" });
    const second = await loader.load();
    expect(second).toBe(first); // exact same LoadedTheme returned
    expect(events.some((e) => e.kind === "rollback")).toBe(true);
  });

  it("throws when no previous good theme is available", async () => {
    const wrong = "sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: themeJson } }).fetch,
      integrity: wrong,
      rollbackOnVerifyFailure: true,
    });
    await expect(loader.load()).rejects.toBeInstanceOf(IntegrityVerificationError);
  });
});

describe("RemoteManifestLoader — ETag conditional refresh", () => {
  it("sends If-None-Match on second load and accepts 304 without re-validation", async () => {
    const stub = stubFetch({
      "https://x/theme.json": { status: 200, body: themeJson, etag: '"v1"' },
    });
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stub.fetch,
      cacheTtlMs: 0,
    });
    const first = await loader.load();
    const second = await loader.load();
    expect(second).toBe(first);
    expect(stub.calls().length).toBe(2);
    expect(stub.calls()[1]!.init?.headers?.["If-None-Match"]).toBe('"v1"');
  });

  it("emits not-modified on 304", async () => {
    const stub = stubFetch({
      "https://x/theme.json": { status: 200, body: themeJson, etag: '"v1"' },
    });
    const events: RemoteManifestEvent[] = [];
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stub.fetch,
      cacheTtlMs: 0,
      onEvent: (e) => events.push(e),
    });
    await loader.load();
    await loader.load();
    expect(events.filter((e) => e.kind === "not-modified").length).toBe(1);
  });
});

describe("RemoteManifestLoader — audit events", () => {
  it("emits fetch-start → fetched → verify-success on a happy path with all three checks", async () => {
    const integrity = await computeIntegrity(themeBytes, "sha384");
    const sigB64 = signThemeBase64(themeBytes);
    const events: RemoteManifestEvent[] = [];
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({
        "https://x/theme.json": { status: 200, body: themeJson, etag: '"v1"' },
        "https://x/theme.json.sig": { status: 200, body: sigB64 },
      }).fetch,
      integrity,
      signatureKeys: [publicKey],
      expectedContractVersion: theme.contractVersion as string,
      onEvent: (e) => events.push(e),
    });
    await loader.load();
    const kinds = events.map((e) => e.kind);
    expect(kinds[0]).toBe("fetch-start");
    expect(kinds).toContain("fetched");
    expect(events.filter((e) => e.kind === "verify-success").map((e) => e.kind === "verify-success" && e.method))
      .toEqual(["integrity", "signature", "version"]);
  });

  it("an audit hook that throws never breaks the load", async () => {
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: themeJson } }).fetch,
      onEvent: () => {
        throw new Error("downstream pipeline down");
      },
    });
    await expect(loader.load()).resolves.toBeDefined();
  });

  it("emits cache-hit on a within-TTL re-load (no refetch)", async () => {
    const events: RemoteManifestEvent[] = [];
    const loader = new RemoteManifestLoader({
      url: "https://x/theme.json",
      fetch: stubFetch({ "https://x/theme.json": { status: 200, body: themeJson } }).fetch,
      onEvent: (e) => events.push(e),
    });
    await loader.load();
    await loader.load();
    expect(events.some((e) => e.kind === "cache-hit")).toBe(true);
  });
});
