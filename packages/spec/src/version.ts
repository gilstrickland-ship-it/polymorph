import { CONTRACT_VERSION, DTCG_BASE_VERSION } from "./generated/contract-ids.js";

export { CONTRACT_VERSION, DTCG_BASE_VERSION };

export type VersionBump = "none" | "minor" | "major";

/** Minimal snapshot of a vocabulary version, used to compute the required bump. */
export interface VocabSnapshot {
  tokens: ReadonlyArray<{ id: string; required: boolean }>;
  roles: ReadonlyArray<string>;
}

export interface ManifestDiff {
  bump: VersionBump;
  addedOptional: string[];
  addedRequired: string[];
  /** Tokens that existed but flipped optional → required (a breaking tightening). */
  requiredTightened: string[];
  removedOrRenamed: string[];
  addedRoles: string[];
  removedRoles: string[];
}

/**
 * Classify the change between two vocabulary snapshots per FR-016:
 *   - adding an optional token/role            → MINOR
 *   - adding a required token, tightening to   → MAJOR
 *     required, or renaming/removing anything
 */
export function diffManifests(prev: VocabSnapshot, next: VocabSnapshot): ManifestDiff {
  const prevById = new Map(prev.tokens.map((t) => [t.id, t]));
  const nextById = new Map(next.tokens.map((t) => [t.id, t]));

  const addedOptional: string[] = [];
  const addedRequired: string[] = [];
  const requiredTightened: string[] = [];
  const removedOrRenamed: string[] = [];

  for (const t of next.tokens) {
    const before = prevById.get(t.id);
    if (!before) {
      (t.required ? addedRequired : addedOptional).push(t.id);
    } else if (!before.required && t.required) {
      requiredTightened.push(t.id);
    }
  }
  for (const t of prev.tokens) if (!nextById.has(t.id)) removedOrRenamed.push(t.id);

  const prevRoles = new Set(prev.roles);
  const nextRoles = new Set(next.roles);
  const addedRoles = next.roles.filter((r) => !prevRoles.has(r));
  const removedRoles = prev.roles.filter((r) => !nextRoles.has(r));

  let bump: VersionBump = "none";
  if (
    removedOrRenamed.length > 0 ||
    addedRequired.length > 0 ||
    requiredTightened.length > 0 ||
    removedRoles.length > 0
  ) {
    bump = "major";
  } else if (addedOptional.length > 0 || addedRoles.length > 0) {
    bump = "minor";
  }

  return { bump, addedOptional, addedRequired, requiredTightened, removedOrRenamed, addedRoles, removedRoles };
}
