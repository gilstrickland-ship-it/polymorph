// @polymorph/cli — command-line entry points.
//
// Implemented in Spec B:
//   polymorph validate   validate a DTCG token file against the @polymorph/spec schema.
//   polymorph lint       run the advisory a11y linter (warn, non-blocking).
//   polymorph resolve    resolve aliases + select mode → emit a flat resolved token map.
//   polymorph transform  build-time transform to platform-native artifacts (wraps Style Dictionary).

export const CLI_VERSION = "0.0.0";
