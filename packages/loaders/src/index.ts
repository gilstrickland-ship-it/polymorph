// @polymorph/loaders — pluggable theme delivery behind one ThemeLoader interface.

export {
  type ThemeLoader,
  type LoadedTheme,
  makeLoadedTheme,
  ThemeValidationError,
  LoaderFetchError,
  LoaderParseError,
} from "./theme-loader.js";
export { InlineLoader } from "./inline.js";
export { BundledLoader } from "./bundled.js";
export {
  RemoteManifestLoader,
  type RemoteManifestOptions,
  type RemoteManifestEvent,
  type FetchLike,
  IntegrityVerificationError,
  SignatureVerificationError,
  ContractVersionMismatchError,
} from "./remote-manifest.js";
export {
  computeIntegrity,
  verifyIntegrity,
  parseIntegrity,
  type IntegrityAlg,
  type ParsedIntegrity,
} from "./integrity.js";
export { verifyEd25519, type Ed25519PublicKey } from "./signature.js";
