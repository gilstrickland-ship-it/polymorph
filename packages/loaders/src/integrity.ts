// Integrity verification — SRI-style hashes ("sha256-…", "sha384-…", "sha512-…").
//
// We accept SubresourceIntegrity-style strings because they're already familiar to platform
// engineers, already produced by every CDN, and already parseable by the standard libraries
// of every adapter we target. Don't reinvent.

import { webcrypto } from "node:crypto";

export type IntegrityAlg = "sha256" | "sha384" | "sha512";

export interface ParsedIntegrity {
  alg: IntegrityAlg;
  /** Base64 (not base64url) digest, per SRI. */
  digest: string;
}

const ALG_TO_SUBTLE: Record<IntegrityAlg, string> = {
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
};

export function parseIntegrity(raw: string): ParsedIntegrity {
  const m = /^(sha256|sha384|sha512)-(.+)$/.exec(raw.trim());
  if (!m) throw new Error(`invalid integrity string: ${raw}`);
  return { alg: m[1] as IntegrityAlg, digest: m[2]! };
}

function bytesToBase64(bytes: Uint8Array): string {
  // Node 16+ + modern browsers all have btoa; chunk to avoid argument-length blowups on huge inputs.
  let out = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(out);
}

/** Returns the SRI-compatible string ("sha384-…") for an input byte buffer. */
export async function computeIntegrity(data: Uint8Array, alg: IntegrityAlg = "sha384"): Promise<string> {
  const digest = await webcrypto.subtle.digest(ALG_TO_SUBTLE[alg], data);
  return `${alg}-${bytesToBase64(new Uint8Array(digest))}`;
}

/** Constant-time string compare (length + per-byte XOR). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verify `data` against an SRI integrity string. Returns `true` iff the digest matches. */
export async function verifyIntegrity(data: Uint8Array, expected: string): Promise<boolean> {
  const parsed = parseIntegrity(expected);
  const actual = await computeIntegrity(data, parsed.alg);
  return safeEqual(actual, expected);
}
