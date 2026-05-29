# Tutorial 01 — Install Polymorph & validate your first theme

**Time**: ~5 minutes. **Prerequisites**: Node 22+, npm or pnpm.

---

## 1. Install

```bash
# In your app or a fresh directory
npm install @polymorph/spec @polymorph/core @polymorph/loaders
npm install --save-dev @polymorph/cli
```

That's the minimum. Adapters come later (see [Tutorial 04](Tutorial-04-Web-Adapter)).

## 2. Get a theme

The fastest way is the scaffold:

```bash
npx polymorph init --output theme.tokens.json --modes light,dark
```

You now have `theme.tokens.json` — a structurally valid theme with placeholder values
(all colors are intentionally identical so the lint screams at you to customise).

## 3. Validate it

```bash
npx polymorph validate theme.tokens.json
# ✓ theme.tokens.json is valid
```

If you edit the file and break something, you'll see structured errors:

```bash
npx polymorph validate theme.tokens.json --json
```

## 4. Lint it

```bash
npx polymorph lint theme.tokens.json --mode light
# ⚠ [CONTRAST_TEXT_LOW] text body on surface base has contrast 1:1, below 4.5:1
# … 40-something more warnings because every colour is the same placeholder
```

The exit code is 0 by default (advisory). Add `--strict` to flip warnings into a CI failure:

```bash
npx polymorph lint theme.tokens.json --mode light --strict
```

## 5. Resolve it

`resolve` runs validate → resolve aliases → pick mode → fill component defaults, then
prints the neutral `ResolvedTheme` JSON that every adapter consumes:

```bash
npx polymorph resolve theme.tokens.json --mode dark | head -30
```

## What's next

- [Tutorial 02 — Author a theme from scratch](Tutorial-02-Author-A-Theme): replace
  the placeholders with your brand, understand the `pm.*` vocabulary.
- [Tutorial 03 — Import existing tokens](Tutorial-03-Import-Tokens): if you already have
  Tokens Studio or Figma exports, skip authoring and use one of the three importers.
