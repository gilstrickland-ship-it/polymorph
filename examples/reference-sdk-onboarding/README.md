# @polymorph/example-reference-sdk-onboarding

The reference **vendor SDK** feature: an **account-opening / onboarding** wizard (multi-step
forms, inputs, validation, disclosures) for React Native.

Coded **only against the Polymorph contract** (`@polymorph/spec` semantics via the RN adapter)
— never against any specific bank's primitives or component names. This is the artifact that
proves the thesis: dropping it into Aurora vs. Borealis is a theme/token change with **zero
edits to this package's source**.

## What's here

- `src/onboarding.tsx` — a 3-step wizard (welcome → validated details form → review + disclosure)
  composed solely from `@polymorph/adapter-react-native` components (`Screen`, `Stack`, `Card`,
  `ThemedText`, `Field`, `PrimaryButton`, `StepIndicator`). No `react-native` import, no colors,
  no bank code.
- `tests/reskin.test.ts` — both mock banks validate; the tokens this UI uses resolve in both and
  the brand tokens differ (the re-skin proof).
- `tests/contract-adherence.test.ts` — static proof the source contains no primitives/colors and
  imports only the adapter, spec types, and `react`.

> v1 demo feature. Legal disclosures are rendered as normal themed content in v1 (protected /
> safe-region handling is a deferred fast-follow). On-device rendering is verified by running a
> mock-bank shell under Expo/RN; golden screenshots are **Spec E**. Implemented in **Spec D**.
