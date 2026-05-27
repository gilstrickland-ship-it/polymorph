// @polymorph/loaders — pluggable theme delivery behind one ThemeLoader interface.
//
// Implemented in Spec B:
//   - InlineLoader          host passes a token object at SDK init (simplest, primary).
//   - RemoteManifestLoader  fetch a versioned token JSON from an FI-controlled URL/CDN;
//                           cache + validate (+ optional signature/integrity check).
//   - BundledLoader         build-time-compiled theme package bundled into the app.
// Loaders return a validated, resolved theme (aliases resolved, mode selected).

export const LOADERS_VERSION = "0.0.0";
