// @polymorph/spec — the theme contract (the standard).
//
// Ships: the semantic vocabulary (manifest/), the JSON Schema (schema/), and the TS types
// below. Data + rules only — the resolver/validator engine lives in @polymorph/core (Spec B).

export * from "./types.js";
export * from "./vocabulary.js";
export {
  CONTRACT_VERSION,
  DTCG_BASE_VERSION,
  diffManifests,
  type VersionBump,
  type VocabSnapshot,
  type ManifestDiff,
} from "./version.js";
export {
  ALL_TOKEN_IDS,
  REQUIRED_TOKEN_IDS,
  MODE_SENSITIVE_TOKEN_IDS,
  TOKENS,
  COMPONENT_ROLES,
  PROTECTED_FLOORS,
  DEFAULT_MODE,
  SUPPORTED_MODES,
  type ManifestTokenEntry,
  type ComponentRoleEntry,
  type ProtectedFloor,
  type ProtectedFloorRule,
  type ProtectedFloorKind,
} from "./generated/contract-ids.js";

// Schemas embedded as objects (generated) — for JS consumers like @polymorph/core.
export { themeSchema, componentsSchema, dtcgTypesSchema } from "./generated/schemas.js";

/** @deprecated use CONTRACT_VERSION */
export const SPEC_VERSION = "0.0.0";
