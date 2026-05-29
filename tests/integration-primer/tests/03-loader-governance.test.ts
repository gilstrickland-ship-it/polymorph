// Spec 022 — RemoteManifestLoader governance (SRI + Ed25519 + version pin + rollback)
// exercised against the Primer-derived theme. Findings: wiki/04-Loader-Governance.md.

import { describe, it, expect, beforeAll } from "vitest";
import { generateKeyPairSync, sign as nodeSign, webcrypto } from "node:crypto";
import {
  RemoteManifestLoader,
  IntegrityVerificationError,
  SignatureVerificationError,
  ContractVersionMismatchError,
  computeIntegrity,
  type FetchLike,
  type RemoteManifestEvent,
} from "@polymorph/loaders";
import { buildPolymorphThemeFromPrimer } from "../src/build-theme.js";

let primerThemeJson: string;
let primerThemeBytes: Uint8Array;
let publicKey: webcrypto.CryptoKey;
let signKeyPem: string;

beforeAll(async () => {
  const theme = buildPolymorphThemeFromPrimer(["light", "dark"]);
  primerThemeJson = JSON.stringify(theme);
  primerThemeBytes = new TextEncoder().encode(primerThemeJson);
  const kp = generateKeyPairSync("ed25519");
  signKeyPem = kp.privateKey.export({ format: "pem", type: "pkcs8" }) as string;
  const spki = new Uint8Array(kp.publicKey.export({ format: "der", type: "spki" }) as Buffer);
  publicKey = await webcrypto.subtle.importKey("spki", spki, { name: "Ed25519" }, false, ["verify"]);
});

const stubFetch = (
  map: Record<string, { status: number; body: string; etag?: string }>,
): FetchLike => async (url, init) => {
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
};

describe("Spec 022 — RemoteManifestLoader against a real Primer-derived theme blob", () => {
  it("integrity check accepts the published bytes + rejects a tampered byte", async () => {
    const integrity = await computeIntegrity(primerThemeBytes, "sha384");
    const url = "https://cdn.example/github.theme.json";

    const good = new RemoteManifestLoader({
      url,
      fetch: stubFetch({ [url]: { status: 200, body: primerThemeJson } }),
      integrity,
    });
    await expect(good.load()).resolves.toBeDefined();

    const tamperedBytes = new Uint8Array(primerThemeBytes);
    tamperedBytes[100]! ^= 0x01;
    const tampered = new RemoteManifestLoader({
      url,
      fetch: stubFetch({ [url]: { status: 200, body: new TextDecoder().decode(tamperedBytes) } }),
      integrity,
    });
    await expect(tampered.load()).rejects.toBeInstanceOf(IntegrityVerificationError);
  });

  it("Ed25519 signature verification accepts a signed blob, rejects a forged one", async () => {
    const url = "https://cdn.example/github.theme.json";
    const signature = nodeSign(null, primerThemeBytes, signKeyPem);
    const sigB64 = Buffer.from(signature).toString("base64");

    const loader = new RemoteManifestLoader({
      url,
      fetch: stubFetch({
        [url]: { status: 200, body: primerThemeJson },
        [`${url}.sig`]: { status: 200, body: sigB64 },
      }),
      signatureKeys: [publicKey],
    });
    await expect(loader.load()).resolves.toBeDefined();

    const forged = new RemoteManifestLoader({
      url,
      fetch: stubFetch({
        [url]: { status: 200, body: primerThemeJson },
        [`${url}.sig`]: { status: 200, body: Buffer.from(new Uint8Array(64).fill(1)).toString("base64") },
      }),
      signatureKeys: [publicKey],
    });
    await expect(forged.load()).rejects.toBeInstanceOf(SignatureVerificationError);
  });

  it("version pin rejects a contract-version mismatch", async () => {
    const url = "https://cdn.example/github.theme.json";
    const loader = new RemoteManifestLoader({
      url,
      fetch: stubFetch({ [url]: { status: 200, body: primerThemeJson } }),
      expectedContractVersion: "9.9.9",
    });
    await expect(loader.load()).rejects.toBeInstanceOf(ContractVersionMismatchError);
  });

  it("audit hook receives the full event sequence on a clean load", async () => {
    const url = "https://cdn.example/github.theme.json";
    const events: RemoteManifestEvent[] = [];
    const loader = new RemoteManifestLoader({
      url,
      fetch: stubFetch({ [url]: { status: 200, body: primerThemeJson, etag: '"primer-v1"' } }),
      cacheTtlMs: 0,
      onEvent: (e) => events.push(e),
    });
    await loader.load();
    await loader.load(); // Second load should ETag-304.

    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain("fetch-start");
    expect(kinds).toContain("fetched");
    expect(kinds).toContain("not-modified");
  });
});
