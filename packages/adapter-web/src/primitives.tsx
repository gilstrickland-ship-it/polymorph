import { type CSSProperties, type ReactNode, type ChangeEvent } from "react";
import { useThemeBridge } from "./provider.js";

type SpaceToken =
  | "pm.space.xs"
  | "pm.space.sm"
  | "pm.space.md"
  | "pm.space.lg"
  | "pm.space.xl";

/** Page surface: fills the viewport area with the base surface color and a default inset. */
export function Screen({ children }: { children?: ReactNode }) {
  const t = useThemeBridge();
  const style: CSSProperties = {
    minHeight: "100%",
    backgroundColor: t.color("pm.color.surface.base"),
    padding: t.dim("pm.space.lg"),
  };
  return <div style={style}>{children}</div>;
}

/** Raised container (card/sheet). */
export function Card({ children }: { children?: ReactNode }) {
  const t = useThemeBridge();
  const style: CSSProperties = {
    backgroundColor: t.color("pm.color.surface.raised"),
    borderRadius: t.dim("pm.radius.card"),
    padding: t.dim("pm.space.md"),
  };
  return <div style={style}>{children}</div>;
}

/** Vertical layout with a theme-driven gap (so SDKs avoid hardcoded spacing). */
export function Stack({
  gap = "pm.space.md",
  children,
}: {
  gap?: SpaceToken;
  children?: ReactNode;
}) {
  const t = useThemeBridge();
  const style: CSSProperties = { display: "flex", flexDirection: "column", gap: t.dim(gap) };
  return <div style={style}>{children}</div>;
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
  children?: ReactNode;
}) {
  const t = useThemeBridge();
  const Tag = variant === "heading" ? "h2" : variant === "caption" ? "small" : variant === "label" ? "label" : "span";
  const style: CSSProperties = {
    ...t.typography(VARIANT_TYPO[variant]),
    color: t.color(muted ? "pm.color.text.muted" : "pm.color.text.body"),
    margin: 0,
  };
  return <Tag style={style}>{children}</Tag>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const t = useThemeBridge();
  const style: CSSProperties = {
    backgroundColor: t.color(
      disabled ? "pm.color.action.primary.disabled" : "pm.color.action.primary.rest",
    ),
    color: t.color("pm.color.text.onAction"),
    borderRadius: t.dim("pm.radius.control"),
    minHeight: t.dim("pm.size.control.md"),
    padding: `0 ${t.dim("pm.space.md")}`,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    ...t.typography("pm.typography.label"),
  };
  return (
    <button type="button" style={style} disabled={disabled} onClick={onPress}>
      {label}
    </button>
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
  onChangeText?: (text: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const t = useThemeBridge();
  const borderColor = error ? t.color("pm.color.feedback.error") : t.color("pm.color.border.default");
  const wrapper: CSSProperties = { display: "flex", flexDirection: "column", gap: t.dim("pm.space.xs") };
  const input: CSSProperties = {
    ...t.typography("pm.typography.body"),
    color: t.color("pm.color.text.body"),
    backgroundColor: t.color("pm.color.surface.raised"),
    borderColor,
    borderWidth: t.dim("pm.border.width.thin"),
    borderStyle: "solid",
    borderRadius: t.dim("pm.radius.control"),
    minHeight: t.dim("pm.size.control.md"),
    padding: `0 ${t.dim("pm.space.sm")}`,
  };
  return (
    <div style={wrapper}>
      {label ? <ThemedText variant="label">{label}</ThemedText> : null}
      <input
        type="text"
        value={value ?? ""}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeText?.(e.target.value)}
        placeholder={placeholder}
        style={input}
      />
      {error ? <ThemedText variant="caption">{error}</ThemedText> : null}
    </div>
  );
}

export function StepIndicator({ count, active }: { count: number; active: number }) {
  const t = useThemeBridge();
  const row: CSSProperties = { display: "flex", flexDirection: "row", gap: t.dim("pm.space.xs") };
  return (
    <div style={row}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            width: t.dim("pm.space.sm"),
            height: t.dim("pm.space.sm"),
            borderRadius: t.dim("pm.radius.pill"),
            backgroundColor:
              i <= active
                ? t.color("pm.color.action.primary.rest")
                : t.color("pm.color.border.default"),
            display: "inline-block",
          }}
        />
      ))}
    </div>
  );
}
