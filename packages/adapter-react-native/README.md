# @polymorph/adapter-react-native

The **first** Polymorph platform adapter and the v1 vertical slice.

- **ThemeProvider** — takes the resolved token map from `@polymorph/core` and exposes it idiomatically (context + `StyleSheet` / styled primitives).
- **Render slots** — named host override points (e.g. `Header`, `PrimaryButton`, `Field`, `StepIndicator`, `Disclosure`); default to the themed SDK component.
- **Component-mapping registry** — optional, role-based mapping of SDK component roles to host component-library entries.

> Implemented in **Spec C — React Native adapter**. Web, Flutter, and native iOS/Android
> adapters follow post-v1 against the same contract.
