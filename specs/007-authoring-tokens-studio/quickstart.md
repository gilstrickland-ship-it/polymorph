# Quickstart: Authoring — Tokens Studio Import

## Import an FI's Tokens Studio export

```ts
import { importTokensStudio, lintMapping } from "@polymorph/authoring";
import { validateTheme } from "@polymorph/core";

const mappingErrors = lintMapping(mapping);
if (mappingErrors.length) throw new Error(mappingErrors.join("\n"));

const { theme, report } = importTokensStudio(tokensStudioExport, mapping);
console.log(`imported ${new Set(report.imported).size} ids`);
if (report.missing.length || report.unconvertible.length) {
  console.warn("incomplete:", { missing: report.missing.slice(0, 5), unconvertible: report.unconvertible.slice(0, 5) });
}

const result = validateTheme(theme);
if (!result.valid) throw new Error(result.errors.map((e) => e.message).join("\n"));
```

## A mapping example

```jsonc
{
  "invariant": {
    "sets": ["global"],
    "ids": {
      "pm.space.md": "spacing.md",
      "pm.radius.control": "borderRadius.control",
      "pm.typography.body": "typography.body"
      /* …all mode-invariant ids… */
    }
  },
  "modes": {
    "light": {
      "sets": ["global", "light"],
      "ids": {
        "pm.color.surface.base": "color.background.primary",
        "pm.color.action.primary.rest": "color.brand.primary",
        "pm.color.text.body": "color.text.body"
        /* …all mode-sensitive ids… */
      }
    },
    "dark": {
      "sets": ["global", "dark"],
      "ids": { /* same id keys, possibly same TS paths since TS overrides at the set level */ }
    }
  }
}
```

## Regenerate the e2e fixture

```bash
node tooling/authoring/scripts/gen-tokens-studio-fixture.mjs
pnpm --filter @polymorph/authoring test
```

The generator emits `tests/fixtures/tokens-studio.export.json` + `tests/fixtures/mapping.json`
covering every manifest token. CI's drift guard re-runs it on every PR and fails on diff.

## Verification → Success Criteria

- **SC-001/002**: `tests/import.test.ts` — fixture imports with no `missing`/`unconvertible`, the
  result `validateTheme.valid === true`, both modes resolve, and mode-sensitive values differ.
- **SC-003**: `tests/convert.test.ts` — per-type converters and alias resolver.
- **SC-004**: `nx run-many -t build typecheck test conformance --skip-nx-cache` green across **11
  projects**.
