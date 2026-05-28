# Contract: `@polymorph/adapter-react-native` API

```ts
import type { ComponentType } from "react";
import type { ResolvedTheme, SemanticTokenId, ComponentRole } from "@polymorph/spec";

// --- theme bridge (neutral) --------------------------------------------------
export interface TypographyStyle { fontFamily?: string; fontWeight?: string | number; fontSize?: number; lineHeight?: number; letterSpacing?: number }
export interface ThemeBridge {
  readonly raw: ResolvedTheme;
  has(id: SemanticTokenId): boolean;
  color(id: SemanticTokenId): string;     // throws if absent
  dim(id: SemanticTokenId): number;       // dimension/size/radius → number
  num(id: SemanticTokenId): number;       // e.g. opacity
  typography(id: SemanticTokenId): TypographyStyle;
}
export function createBridge(rt: ResolvedTheme): ThemeBridge;

// --- provider + hooks (react only) -------------------------------------------
export interface ThemeProviderProps { theme: ResolvedTheme; slots?: SlotComponents; components?: ComponentRegistry; children?: React.ReactNode }
export function ThemeProvider(props: ThemeProviderProps): React.ReactElement;
export function useTheme(): { theme: ResolvedTheme; bridge: ThemeBridge; slots: SlotComponents; components: ComponentRegistry };
export const useThemeBridge: () => ThemeBridge;
export const useResolvedTheme: () => ResolvedTheme;
export function useSlot<P>(name: SlotName, fallback: ComponentType<P>): ComponentType<P>;
export function useThemedComponent<P>(role: ComponentRole, fallback: ComponentType<P>): ComponentType<P>;

// --- slots & component mapping (neutral) -------------------------------------
export type SlotName = "Header" | "PrimaryButton" | "Field" | "StepIndicator" | "Disclosure";
export type SlotComponents = Partial<Record<SlotName, ComponentType<unknown>>>;
export function resolveSlot<P>(slots: SlotComponents, name: SlotName, fallback: ComponentType<P>): ComponentType<P>;
export type ComponentRegistry = Partial<Record<ComponentRole, ComponentType<unknown>>>;
export function resolveComponent<P>(reg: ComponentRegistry, role: ComponentRole, fallback: ComponentType<P>): ComponentType<P>;

// --- retrofit (neutral) ------------------------------------------------------
export function toTokenMap(rt: ResolvedTheme): Record<SemanticTokenId, unknown>;

// --- themed primitives (import react-native; verified in Spec D) -------------
export function Screen(props): React.ReactElement;
export function Card(props): React.ReactElement;
export function ThemedText(props): React.ReactElement;     // variant: heading|body|label|caption
export function PrimaryButton(props): React.ReactElement;
export function Field(props): React.ReactElement;
export function StepIndicator(props): React.ReactElement;
```

Import note: the package index re-exports primitives (which import `react-native`). Node-side tools
and tests import the neutral modules directly (`.../theme-bridge.js`, `.../provider.js`, etc.).
