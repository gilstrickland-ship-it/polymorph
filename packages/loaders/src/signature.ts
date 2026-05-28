// Ed25519 detached-signature verification.
//
// Callers supply already-imported `CryptoKey` objects (one per accepted signing key — supports
// rotation by trusting both old + new during a cutover window). We don't accept raw bytes
// because (a) SubtleCrypto's `importKey` parameters differ between Node + browser + workers
// for ed25519, and (b) the caller is in a better position to source / cache / rotate the key
// material. The docs page shows the one-time `importKey` snippet for each environment.
//
// The exported type aliases Node's `webcrypto.CryptoKey`, which is structurally identical to
// the DOM `CryptoKey` — browser callers pass a DOM `CryptoKey` and TS accepts it.

import { webcrypto } from "node:crypto";

export type Ed25519PublicKey = webcrypto.CryptoKey;

/**
 * Verify a detached Ed25519 signature against `data` for ANY of the supplied keys. Returns
 * the matching key's index, or `null` if no key validates (use a constant-time-friendly
 * iteration: every key is tried even on early match, because the cost is bounded by the
 * caller's accepted-key set, which is typically 1-3).
 */
export async function verifyEd25519(
  data: Uint8Array,
  signature: Uint8Array,
  keys: Ed25519PublicKey[],
): Promise<number | null> {
  if (keys.length === 0) return null;
  let matched: number | null = null;
  for (let i = 0; i < keys.length; i++) {
    let ok = false;
    try {
      ok = await webcrypto.subtle.verify("Ed25519", keys[i]!, signature, data);
    } catch {
      ok = false;
    }
    if (ok && matched === null) matched = i;
  }
  return matched;
}
