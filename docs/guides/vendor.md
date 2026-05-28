# Vendor: SDK authors

You're a banking-platform vendor shipping a feature into FI digital-banking apps. You want
**one SDK build that re-skins to every host bank without per-FI forks**. Here's how Polymorph
gets you there.

## Rule one: target the contract, never the FI

Your SDK source must reference only **`pm.*` semantic tokens and component roles**. Never:

- Hex colour literals (`#1f5cff`)
- `rgb()` / `hsl()` / `oklch()` etc.
- Bank-specific token paths (`brand.aurora.blue`, `palette.borealis.surface`)
- Platform-primitive colour APIs that bypass the theme

A static contract-adherence test enforces this in the reference SDK; you should do the same.

```ts
// ✗ Wrong
const styles = { background: "#1f5cff", color: "#ffffff" };

// ✓ Right
const t = useResolvedTheme();
const styles = {
  background: t.tokens["pm.color.action.primary.rest"].value,
  color: t.tokens["pm.color.text.onAction"].value,
};

// ✓ Better — use themed primitives
<PrimaryButton onPress={next}>Continue</PrimaryButton>
```

## Pattern: themed components first, slots as escape hatch

Default to the SDK's themed components. They handle every semantic / component-token pairing
correctly and stay aligned with the contract.

When a host needs pixel-perfect parity with their existing component library, register a
**slot** override:

```tsx
<ThemeProvider theme={resolved} slots={{ PrimaryButton: HostButton }}>
  <YourFeature />
</ThemeProvider>
```

Inside the SDK, `useSlot("PrimaryButton", DefaultPrimaryButton)` returns `HostButton` if
registered, otherwise the SDK's themed default. **The SDK doesn't know or care which is
chosen.** That's the whole point.

For richer per-role mapping (e.g. swapping every `input` to a bank's existing `<HostInput>`),
use the component-mapping registry:

```tsx
<ThemeProvider theme={resolved} components={{ input: HostInput }}>...</ThemeProvider>
```

Inside the SDK:

```tsx
const Input = useThemedComponent("input", DefaultInput);
```

## Testing the contract boundary

Two checks earn their keep:

1. **Static contract adherence** — a unit test that scans the SDK source for forbidden
   patterns: hex colours, `rgb()`, `react-native` colour imports, bank token paths.
   `examples/reference-sdk-onboarding/tests/contract-adherence.test.ts` is the reference.
2. **Re-skin test** — render the SDK against two distinct themes (the bank fixtures), then
   diff the rendered output. Anything that doesn't differ across themes is theme-independent
   (good); anything that differs identically is theme-driven (also good); anything in between
   is a bug. `reskin.test.ts` is the reference.

## Distributing to FIs

You ship your SDK package once. The FI:

1. Picks a loader (Inline / RemoteManifest / Bundled — see [Loaders](/guide/loaders)).
2. Authors or imports its theme (see [FI authoring guide](/guides/fi)).
3. Passes the resolved theme to your `ThemeProvider`.

You don't ship a "themed build per bank." The same artifact runs everywhere.

## Versioning the contract

Pin to a vocabulary major in your SDK's peer dependency on `@polymorph/spec`. **Additive
changes** (new tokens, new component roles) are minor bumps — your SDK doesn't have to react.
**Renaming or removing tokens** is a major bump and means you re-target the SDK.

For most vendors the major bump is rare; new tokens land because *some* vendor needs them, and
existing vendors keep working until they choose to consume the new ones.

## Platform coverage

You write the SDK once per platform (you can't avoid that — React Native isn't Flutter). But
each platform's SDK is one build, not *N* per design system.

| Vendor SDK lives in… | Polymorph adapter |
|---|---|
| Web (React) | `@polymorph/adapter-web` |
| Web (Vue / Solid / Angular) | `@polymorph/adapter-web-{vue,solid,angular}` |
| React Native | `@polymorph/adapter-react-native` |
| Flutter | Use the generated Dart file — no Polymorph runtime dependency |
| iOS / SwiftUI | Use the generated Swift file — no Polymorph runtime dependency |
| Android / Compose | Use the generated Kotlin file — no Polymorph runtime dependency |

Native targets are codegen-only: you ship your Flutter / iOS / Android SDK against a generated
theme file the FI emits at build time.
