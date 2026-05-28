import { createMemo, type Component, type JSX } from "solid-js";
import h from "solid-js/h";
import { useThemeBridge } from "./composables.js";

type SpaceToken = "pm.space.xs" | "pm.space.sm" | "pm.space.md" | "pm.space.lg" | "pm.space.xl";

/**
 * Note on typing: `solid-js/h` returns a callable wrapper that produces JSX.Element at render
 * time (Solid's reactivity defers element creation). TS sees this as `() => JSX.Element` rather
 * than `JSX.Element`, so we cast at the function boundary. At runtime Solid handles both forms.
 */
const asEl = (v: unknown): JSX.Element => v as unknown as JSX.Element;

export const Screen: Component<{ children?: JSX.Element }> = (props) =>
  asEl(
    h(
      "div",
      {
        style: createMemo(() => {
          const t = useThemeBridge();
          return {
            "min-height": "100%",
            "background-color": t.color("pm.color.surface.base"),
            padding: t.dim("pm.space.lg"),
          };
        }),
      },
      props.children,
    ),
  );

export const Card: Component<{ children?: JSX.Element }> = (props) =>
  asEl(
    h(
      "div",
      {
        style: createMemo(() => {
          const t = useThemeBridge();
          return {
            "background-color": t.color("pm.color.surface.raised"),
            "border-radius": t.dim("pm.radius.card"),
            padding: t.dim("pm.space.md"),
          };
        }),
      },
      props.children,
    ),
  );

export const Stack: Component<{ gap?: SpaceToken; children?: JSX.Element }> = (props) =>
  asEl(
    h(
      "div",
      {
        style: createMemo(() => {
          const t = useThemeBridge();
          return { display: "flex", "flex-direction": "column", gap: t.dim(props.gap ?? "pm.space.md") };
        }),
      },
      props.children,
    ),
  );

const VARIANT_TYPO = {
  heading: "pm.typography.heading",
  body: "pm.typography.body",
  label: "pm.typography.label",
  caption: "pm.typography.caption",
} as const;
type TextVariant = keyof typeof VARIANT_TYPO;

const TAG_FOR_VARIANT: Record<TextVariant, string> = {
  heading: "h2",
  caption: "small",
  label: "label",
  body: "span",
};

export const ThemedText: Component<{ variant?: TextVariant; muted?: boolean; children?: JSX.Element }> = (props) => {
  // Tag is captured once on mount (variant typically doesn't change mid-life). Style stays reactive.
  const v = props.variant ?? "body";
  const tag = TAG_FOR_VARIANT[v];
  return asEl(
    h(
      tag,
      {
        style: createMemo(() => {
          const t = useThemeBridge();
          return {
            ...t.typography(VARIANT_TYPO[v]),
            color: t.color(props.muted ? "pm.color.text.muted" : "pm.color.text.body"),
            margin: 0,
          };
        }),
      },
      props.children,
    ),
  );
};

export const PrimaryButton: Component<{ label: string; onPress?: () => void; disabled?: boolean }> = (props) =>
  asEl(
    h(
      "button",
      {
        type: "button",
        get disabled() {
          return props.disabled;
        },
        onClick: () => props.onPress?.(),
        style: createMemo(() => {
          const t = useThemeBridge();
          return {
            "background-color": t.color(
              props.disabled ? "pm.color.action.primary.disabled" : "pm.color.action.primary.rest",
            ),
            color: t.color("pm.color.text.onAction"),
            "border-radius": t.dim("pm.radius.control"),
            "min-height": t.dim("pm.size.control.md"),
            padding: `0 ${t.dim("pm.space.md")}`,
            border: "none",
            cursor: props.disabled ? "not-allowed" : "pointer",
            ...t.typography("pm.typography.label"),
          };
        }),
      },
      props.label,
    ),
  );
