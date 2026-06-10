# @polymorph/cli

Zero-dependency command-line tooling for theme authors and CI, wrapping `@polymorph/core`.

```bash
polymorph validate <file>                 # exit 1 + located errors if invalid, else 0
polymorph lint <file> [--strict]          # advisory warnings; exit 0 (1 with --strict)
polymorph resolve <file> --mode <mode>    # prints ResolvedTheme JSON to stdout
polymorph transform <file> --target <t>   # emit native source (dart | swift | kotlin)
polymorph init [--output <path>]          # scaffold a minimal valid theme
polymorph diff <before> <after>           # structural diff between two themes
polymorph migrate <file>                  # fill missing required tokens + bump contractVersion
```

| Command | Purpose | Exit |
|---|---|---|
| `validate` | Schema + graph validation, located errors. | `0` valid / `1` invalid |
| `lint` | Advisory WCAG 2.1 warnings (non-blocking). | `0` (or `1` with `--strict` if warnings) |
| `resolve` | Resolve aliases + select `--mode` → `ResolvedTheme` JSON. | `0` |
| `transform` | Emit native source for `--target <dart\|swift\|kotlin>` (`--class <Name>`, `--output <path>`). | `0` (or `2` on missing/unknown target) |
| `init` | Scaffold a minimal valid theme (`--output`, `--modes`). | `0` |
| `diff` | Structural diff between two theme files (`--json`). | `0` no differences / `1` differences / `2` read error |
| `migrate` | Fill missing required tokens + bump `contractVersion` (`--output`, `--json`). | `0` migrated / `2` read error |

Shared flags: `--mode <light\|dark\|highContrast>`, `--strict`, `--json`; `transform` adds `--target`, `--class`, `--output`. The library entry point exports
`run(argv): Promise<number>` for in-process use.

> Implemented in **Spec B — Core + Loaders**.
