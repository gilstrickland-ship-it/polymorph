// @polymorph/cli — thin command-line surface over @polymorph/core, plus in-process helpers
// that hosts can embed without shelling out to the binary.
export { run } from "./run.js";
export { buildMinimalTheme, runInit, type InitOpts } from "./commands/init.js";
export {
  diffThemes,
  runDiff,
  type ThemeDiff,
  type ThemeDiffEntry,
  type ChangeKind,
  type DiffOpts,
} from "./commands/diff.js";
export {
  migrateTheme,
  runMigrate,
  type MigrationReport,
  type MigrateOpts,
} from "./commands/migrate.js";
