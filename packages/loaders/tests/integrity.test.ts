import { describe, it, expect } from "vitest";
import { computeIntegrity, verifyIntegrity, parseIntegrity } from "../src/index.js";

const data = new TextEncoder().encode('{"hello":"world"}');

describe("integrity (SRI-style hashing)", () => {
  it("computeIntegrity returns a parseable SRI string for each supported alg", async () => {
    for (const alg of ["sha256", "sha384", "sha512"] as const) {
      const s = await computeIntegrity(data, alg);
      const parsed = parseIntegrity(s);
      expect(parsed.alg).toBe(alg);
      expect(parsed.digest.length).toBeGreaterThan(0);
    }
  });

  it("computeIntegrity defaults to sha384 (matches SubresourceIntegrity recommendation)", async () => {
    const s = await computeIntegrity(data);
    expect(s.startsWith("sha384-")).toBe(true);
  });

  it("verifyIntegrity round-trips against its own digest", async () => {
    const s = await computeIntegrity(data, "sha384");
    expect(await verifyIntegrity(data, s)).toBe(true);
  });

  it("verifyIntegrity rejects a tampered payload", async () => {
    const s = await computeIntegrity(data, "sha384");
    const tampered = new TextEncoder().encode('{"hello":"WORLD"}');
    expect(await verifyIntegrity(tampered, s)).toBe(false);
  });

  it("verifyIntegrity rejects a digest with the wrong alg", async () => {
    const s = await computeIntegrity(data, "sha512");
    // Swap alg prefix; the loader recomputes with sha256 → length-mismatch → false.
    const wrong = s.replace(/^sha512-/, "sha256-");
    expect(await verifyIntegrity(data, wrong)).toBe(false);
  });

  it("parseIntegrity throws on garbage input", () => {
    expect(() => parseIntegrity("not-a-hash")).toThrow();
    expect(() => parseIntegrity("md5-abc")).toThrow();
  });
});
