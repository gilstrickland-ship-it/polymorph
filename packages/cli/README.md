# @polymorph/cli

Zero-dependency command-line tooling for theme authors and CI, wrapping `@polymorph/core`.

```bash
polymorph validate <file>                 # exit 1 + located errors if invalid, else 0
polymorph lint <file> [--strict]          # advisory warnings; exit 0 (1 with --strict)
polymorph resolve <file> --mode <mode>    # prints ResolvedTheme JSON to stdout
```

| Command | Purpose | Exit |
|---|---|---|
| `validate` | Schema + graph validation, located errors. | `0` valid / `1` invalid |
| `lint` | Advisory WCAG 2.1 warnings (non-blocking). | `0` (or `1` with `--strict` if warnings) |
| `resolve` | Resolve aliases + select `--mode` → `ResolvedTheme` JSON. | `0` |
| `transform` | Post-v1 (Style Dictionary). | `1` (not yet implemented) |

Flags: `--mode <light\|dark\|highContrast>`, `--strict`, `--json`. The library entry point exports
`run(argv): Promise<number>` for in-process use.

> Implemented in **Spec B — Core + Loaders**.
