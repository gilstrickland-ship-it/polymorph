# Contract: `@polymorph/adapter-web` API

```ts
import type { ComponentType, ReactElement, ReactNode } from "react";
import type { ResolvedTheme, SemanticTokenId, ComponentRole } from "@polymorph/spec";

// --- framework-agnostic core --------------------------------------------------

// CSS variable name from a semantic id: `pm.color.surface.base` → `--pm-color-surface-base`
export function toCssVarName(id: SemanticTokenId): string;
// One or more CSS-var entries for a (id, $type, value). Typography returns 5.
export function toCssEntries(id: SemanticTokenId, $type: string, value: unknown): [string, string][];
// Flatten a ResolvedTheme into a `{ "--pm-…": "…" }` record.
export function toCssVariables(resolved: ResolvedTheme): Record<string, string>;
// Render as a stylesheet body. Default selector `:root`.
export function toCssVariablesString(resolved: ResolvedTheme, selector?: string): string;

export interface TypographyStyle {
  fontFamily: string;       // var(--…-font-family)
  fontWeight: string;       // var(--…-font-weight)
  fontSize: string;         // var(--…-font-size)
  lineHeight: string;       // var(--…-line-height)
  letterSpacing: string;    // var(--…-letter-spacing)
}
export interface ThemeBridge {
  readonly raw: ResolvedTheme;
  has(id: SemanticTokenId): boolean;
  color(id: SemanticTokenId): string;        // "var(--pm-…)"
  dim(id: SemanticTokenId): string;          // "var(--pm-…)"
  num(id: SemanticTokenId): string;          // "var(--pm-…)"
  typography(id: SemanticTokenId): TypographyStyle;
}
export function createBridge(rt: ResolvedTheme): ThemeBridge;

export type SlotName = "Header" | "PrimaryButton" | "Field" | "StepIndicator" | "Disclosure";
export type SlotComponents = Partial<Record<SlotName, ComponentType<unknown>>>;
export function resolveSlot<P>(slots: SlotComponents, name: SlotName, fallback: ComponentType<P>): ComponentType<P>;

export type ComponentRegistry = Partial<Record<ComponentRole, ComponentType<unknown>>>;
export function resolveComponent<P>(reg: ComponentRegistry, role: ComponentRole, fallback: ComponentType<P>): ComponentType<P>;

export function toTokenMap(rt: ResolvedTheme): Record<SemanticTokenId, unknown>;

// --- React binding -----------------------------------------------------------

export interface ThemeProviderProps {
  theme: ResolvedTheme;
  slots?: SlotComponents;
  components?: ComponentRegistry;
  scope?: string;        // override the auto-generated wrapper class
  children?: ReactNode;
}
export function ThemeProvider(props: ThemeProviderProps): ReactElement;

export function useTheme(): { theme: ResolvedTheme; bridge: ThemeBridge; slots: SlotComponents; components: ComponentRegistry; scope: string };
export const useThemeBridge: () => ThemeBridge;
export const useResolvedTheme: () => ResolvedTheme;
export function useSlot<P>(name: SlotName, fallback: ComponentType<P>): ComponentType<P>;
export function useThemedComponent<P>(role: ComponentRole, fallback: ComponentType<P>): ComponentType<P>;

// --- themed primitives -------------------------------------------------------
export function Screen(props: { children?: ReactNode }): ReactElement;
export function Card(props: { children?: ReactNode }): ReactElement;
export function Stack(props: { gap?: SpaceToken; children?: ReactNode }): ReactElement;
export function ThemedText(props: { variant?: "heading" | "body" | "label" | "caption"; muted?: boolean; children?: ReactNode }): ReactElement;
export function PrimaryButton(props: { label: string; onPress?: () => void; disabled?: boolean }): ReactElement;
export function Field(props: { label?: string; value?: string; onChangeText?: (t: string) => void; placeholder?: string; error?: string }): ReactElement;
export function StepIndicator(props: { count: number; active: number }): ReactElement;
```

## Naming

- `pm.color.surface.base` → `--pm-color-surface-base`
- `pm.typography.body` → 5 sub-vars: `--pm-typography-body-font-family|font-weight|font-size|line-height|letter-spacing`
- `pm.elevation.raised` (shadow) → `--pm-elevation-raised` containing a CSS `box-shadow` string

## Behaviors

- `ThemeProvider`: injects `<style data-polymorph-theme="<scope>">.<scope> { --pm-…: …; … }</style>`
  and wraps children in `<div class="<scope>">`. `theme` changes update the variables; consumers
  don't re-render.
- Bridge accessors throw `theme is missing token: <id>` for absent ids — the linter surfaces this
  upstream; here it's a safety net for misuse.
