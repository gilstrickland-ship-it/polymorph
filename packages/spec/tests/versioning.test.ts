import { describe, it, expect } from "vitest";
import { diffManifests, type VocabSnapshot } from "../src/version.js";
import { readJson } from "./helpers.js";

const manifest = readJson("manifest/semantic-vocabulary.v0.json") as {
  tokens: { id: string; required: boolean }[];
  componentRoles: { role: string }[];
};
const base: VocabSnapshot = {
  tokens: manifest.tokens.map((t) => ({ id: t.id, required: t.required })),
  roles: manifest.componentRoles.map((r) => r.role),
};
const clone = (): { tokens: { id: string; required: boolean }[]; roles: string[] } => ({
  tokens: base.tokens.map((t) => ({ ...t })),
  roles: [...base.roles],
});

describe("vocabulary versioning (US5, FR-016)", () => {
  it("no change → none", () => {
    expect(diffManifests(base, clone()).bump).toBe("none");
  });

  it("adding an optional token → minor (and prior themes stay valid, SC-004)", () => {
    const next = clone();
    next.tokens.push({ id: "pm.color.text.placeholder", required: false });
    expect(diffManifests(base, next).bump).toBe("minor");
  });

  it("adding a required token → major", () => {
    const next = clone();
    next.tokens.push({ id: "pm.color.text.placeholder", required: true });
    const d = diffManifests(base, next);
    expect(d.bump).toBe("major");
    expect(d.addedRequired).toContain("pm.color.text.placeholder");
  });

  it("tightening optional → required → major", () => {
    const next = clone();
    const t = next.tokens.find((x) => x.id === "pm.color.text.subtle")!;
    t.required = true;
    expect(diffManifests(base, next).bump).toBe("major");
  });

  it("removing/renaming a token → major", () => {
    const next = clone();
    next.tokens = next.tokens.filter((x) => x.id !== "pm.color.text.body");
    const d = diffManifests(base, next);
    expect(d.bump).toBe("major");
    expect(d.removedOrRenamed).toContain("pm.color.text.body");
  });

  it("adding a role → minor; removing a role → major", () => {
    const added = clone();
    added.roles.push("badge");
    expect(diffManifests(base, added).bump).toBe("minor");

    const removed = clone();
    removed.roles = removed.roles.filter((r) => r !== "input");
    expect(diffManifests(base, removed).bump).toBe("major");
  });
});
