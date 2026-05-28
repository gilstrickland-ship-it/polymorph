import * as React from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { useThemeBridge } from "./provider.js";

const { createElement: h } = React;

/** Page surface — fills with the base surface color and a default inset. */
export function Screen({ children }: { children?: React.ReactNode }): React.ReactElement {
  const t = useThemeBridge();
  return h(
    View,
    { style: { flex: 1, backgroundColor: t.color("pm.color.surface.base"), padding: t.dim("pm.space.lg") } },
    children,
  );
}

/** Raised container (card/sheet). */
export function Card({ children }: { children?: React.ReactNode }): React.ReactElement {
  const t = useThemeBridge();
  return h(
    View,
    {
      style: {
        backgroundColor: t.color("pm.color.surface.raised"),
        borderRadius: t.dim("pm.radius.card"),
        padding: t.dim("pm.space.md"),
      },
    },
    children,
  );
}

type SpaceToken = "pm.space.xs" | "pm.space.sm" | "pm.space.md" | "pm.space.lg" | "pm.space.xl";

/** Vertical stack with theme-driven gap (so SDKs lay out without hardcoded numbers). */
export function Stack({
  gap = "pm.space.md",
  children,
}: {
  gap?: SpaceToken;
  children?: React.ReactNode;
}): React.ReactElement {
  const t = useThemeBridge();
  return h(View, { style: { flexDirection: "column", gap: t.dim(gap) } }, children);
}


export type TextVariant = "heading" | "body" | "label" | "caption";
const VARIANT_TYPO: Record<TextVariant, "pm.typography.heading" | "pm.typography.body" | "pm.typography.label" | "pm.typography.caption"> = {
  heading: "pm.typography.heading",
  body: "pm.typography.body",
  label: "pm.typography.label",
  caption: "pm.typography.caption",
};

export function ThemedText({
  variant = "body",
  muted = false,
  children,
}: {
  variant?: TextVariant;
  muted?: boolean;
  children?: React.ReactNode;
}): React.ReactElement {
  const t = useThemeBridge();
  return h(
    Text,
    {
      style: {
        ...t.typography(VARIANT_TYPO[variant]),
        color: t.color(muted ? "pm.color.text.muted" : "pm.color.text.body"),
      },
    },
    children,
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}): React.ReactElement {
  const t = useThemeBridge();
  return h(
    Pressable,
    {
      onPress,
      disabled,
      style: {
        backgroundColor: t.color(disabled ? "pm.color.action.primary.disabled" : "pm.color.action.primary.rest"),
        borderRadius: t.dim("pm.radius.control"),
        minHeight: t.dim("pm.size.control.md"),
        paddingHorizontal: t.dim("pm.space.md"),
        alignItems: "center",
        justifyContent: "center",
      },
    },
    h(Text, { style: { ...t.typography("pm.typography.label"), color: t.color("pm.color.text.onAction") } }, label),
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
}: {
  label?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  error?: string;
}): React.ReactElement {
  const t = useThemeBridge();
  const borderColor = error ? t.color("pm.color.feedback.error") : t.color("pm.color.border.default");
  return h(
    View,
    { style: { gap: t.dim("pm.space.xs") } },
    label ? h(ThemedText, { variant: "label", key: "l" }, label) : null,
    h(TextInput, {
      key: "i",
      value,
      onChangeText,
      placeholder,
      style: {
        ...t.typography("pm.typography.body"),
        color: t.color("pm.color.text.body"),
        backgroundColor: t.color("pm.color.surface.raised"),
        borderColor,
        borderWidth: t.dim("pm.border.width.thin"),
        borderRadius: t.dim("pm.radius.control"),
        minHeight: t.dim("pm.size.control.md"),
        paddingHorizontal: t.dim("pm.space.sm"),
      },
    }),
    error ? h(ThemedText, { variant: "caption", key: "e" }, error) : null,
  );
}

export function StepIndicator({ count, active }: { count: number; active: number }): React.ReactElement {
  const t = useThemeBridge();
  const dots = Array.from({ length: count }, (_, i) =>
    h(View, {
      key: i,
      style: {
        width: t.dim("pm.space.sm"),
        height: t.dim("pm.space.sm"),
        borderRadius: t.dim("pm.radius.pill"),
        backgroundColor: i <= active ? t.color("pm.color.action.primary.rest") : t.color("pm.color.border.default"),
      },
    }),
  );
  return h(View, { style: { flexDirection: "row", gap: t.dim("pm.space.xs") } }, ...dots);
}

// Touch StyleSheet so the import is exercised (RN requires it present at runtime).
export const _styles = StyleSheet.create({ _noop: {} });
