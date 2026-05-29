# FI: theme authoring

You're a financial institution adopting a Polymorph-built SDK and supplying your design system
as data. Your job: produce a single token file that satisfies the contract and represents your
brand. Here's the path.

## What you author

One `*.tokens.json` file per "bank theme" you want to ship. It contains:

1. **Primitives** (optional, in any namespace you choose) — your palette, type scale, spacing
   scale, durations. The vendor SDK never references these directly.
2. **Semantic tokens** under the reserved `pm.*` namespace — required for the contract to
   validate. Most are aliases pointing at your primitives:
   ```json
   "pm.color.action.primary.rest": { "$type": "color", "value": "{brand.blue.500}" }
   ```
3. **Component tokens** (optional) — per-role overrides like `button.primary.background`.
   Omit any you don't want to customise; resolution falls back to the semantic default.
4. **Modes** — `light` / `dark` / `highContrast` variants colocated:
   ```json
   "pm.color.surface.base": {
     "$type": "color",
     "value": { "modes": { "light": "{brand.white}", "dark": "{brand.navy.900}" } }
   }
   ```

## Validating as you author

```bash
pnpm polymorph validate aurora.tokens.json    # schema + alias-graph
pnpm polymorph lint aurora.tokens.json         # WCAG 2.1 contrast (advisory)
pnpm polymorph resolve aurora.tokens.json --mode dark    # see the resolved snapshot
```

Validation fails loud on missing required tokens, broken aliases, type mismatches, and
out-of-range numbers (e.g. opacity > 1).

## Authoring paths

Four increasingly hands-off options:

| Path | When to use |
|---|---|
| **Hand-author DTCG JSON** | You already maintain DTCG tokens. Direct, no transforms. |
| **Tokens Studio import** | Your design tokens live in Figma via Tokens Studio. See [the importer guide](/guides/tokens-studio). |
| **Figma Variables import** | Your design tokens live in Figma Variables (the native surface). See [the importer guide](/guides/figma-variables). Covers color / dimension / number / duration. |
| **Figma Styles import** | Your typography + effects live in Figma Text Styles + Effect Styles. See [the importer guide](/guides/figma-styles). Composes with Figma Variables for a fully Figma-native authoring posture. |

All four paths produce the same DTCG-shaped output. The vendor SDK doesn't know or care
which path you took.

### Visual editing

If your team prefers a visual editor over hand-editing JSON, `@polymorph/builder` ships
headless React primitives — `useThemeEditor` hook, typed token fields, accessible lint
panel, unstyled `ThemeEditorRoot` orchestrator. Drop it into your internal tooling and
style it to match. See [Interactive theme builder](/guide/builder).

## Modes strategy

Pick a baseline mode (usually `light`) and define your full token set against it. For each
token whose value differs in another mode, attach a `modes` map:

```json
"pm.color.text.body": {
  "$type": "color",
  "value": {
    "modes": {
      "light": "{brand.ink.700}",
      "dark": "{brand.paper.100}",
      "highContrast": "#000000"
    }
  }
}
```

The DTCG schema doesn't require every mode for every token; `resolveTheme` falls back to
`light` when a mode is missing.

## Delivery

How the token file reaches the running app is your choice — and it can change without breaking
the SDK:

- **Inline** — bundle the JSON into your existing app and pass it at SDK init. Simplest.
- **RemoteManifest** — host the JSON on your CDN; the SDK fetches at runtime. Theme updates
  without an app release. Production posture composes SRI integrity + Ed25519 signature +
  version pin + fail-closed rollback + ETag refresh + a typed audit hook — see
  [Loader governance](/guide/loader-governance).
- **Bundled** — publish a versioned `@your-bank/polymorph-theme` package and import it.

See [Loaders](/guide/loaders) for the API shape.

## Versioning your theme

Treat your theme file like any other versioned artifact in your release pipeline. We
recommend:

- **Semver** the JSON itself. Adding component overrides is a minor bump; reshaping a
  semantic value or dropping a mode is a major bump.
- **Pin the contract version** your theme targets in the file's `contractVersion` field.
  Mismatches with the SDK's expected major produce a clear error at load time.

## What you don't own

- **A11y certification.** Polymorph's linter is advisory; signing off final WCAG / Section 508
  compliance is on you. The linter helps; it doesn't gate.
- **The SDK's component structure.** You can override slots and map components — you can't
  reshape the vendor's information architecture.
- **Visual parity with your full app.** Polymorph re-skins the SDK to match your design
  system; pixel-perfect identity with bespoke screens is what the slot mechanism is for.
