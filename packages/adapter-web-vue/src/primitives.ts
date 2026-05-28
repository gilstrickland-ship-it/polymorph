import { defineComponent, h, type PropType } from "vue";
import { useThemeBridge } from "./composables.js";

type SpaceToken = "pm.space.xs" | "pm.space.sm" | "pm.space.md" | "pm.space.lg" | "pm.space.xl";

export const Screen = defineComponent({
  name: "Screen",
  setup(_, { slots }) {
    const t = useThemeBridge();
    return () =>
      h(
        "div",
        {
          style: {
            minHeight: "100%",
            backgroundColor: t.color("pm.color.surface.base"),
            padding: t.dim("pm.space.lg"),
          },
        },
        slots.default?.(),
      );
  },
});

export const Card = defineComponent({
  name: "Card",
  setup(_, { slots }) {
    const t = useThemeBridge();
    return () =>
      h(
        "div",
        {
          style: {
            backgroundColor: t.color("pm.color.surface.raised"),
            borderRadius: t.dim("pm.radius.card"),
            padding: t.dim("pm.space.md"),
          },
        },
        slots.default?.(),
      );
  },
});

export const Stack = defineComponent({
  name: "Stack",
  props: {
    gap: { type: String as PropType<SpaceToken>, default: "pm.space.md" },
  },
  setup(props, { slots }) {
    const t = useThemeBridge();
    return () =>
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: t.dim(props.gap) } },
        slots.default?.(),
      );
  },
});

const VARIANT_TYPO = {
  heading: "pm.typography.heading",
  body: "pm.typography.body",
  label: "pm.typography.label",
  caption: "pm.typography.caption",
} as const;
type TextVariant = keyof typeof VARIANT_TYPO;

export const ThemedText = defineComponent({
  name: "ThemedText",
  props: {
    variant: { type: String as PropType<TextVariant>, default: "body" },
    muted: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const t = useThemeBridge();
    return () => {
      const tag = props.variant === "heading" ? "h2" : props.variant === "caption" ? "small" : props.variant === "label" ? "label" : "span";
      return h(
        tag,
        {
          style: {
            ...t.typography(VARIANT_TYPO[props.variant]),
            color: t.color(props.muted ? "pm.color.text.muted" : "pm.color.text.body"),
            margin: 0,
          },
        },
        slots.default?.(),
      );
    };
  },
});

export const PrimaryButton = defineComponent({
  name: "PrimaryButton",
  props: {
    label: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: { press: () => true },
  setup(props, { emit }) {
    const t = useThemeBridge();
    return () =>
      h(
        "button",
        {
          type: "button",
          disabled: props.disabled,
          onClick: () => emit("press"),
          style: {
            backgroundColor: t.color(
              props.disabled ? "pm.color.action.primary.disabled" : "pm.color.action.primary.rest",
            ),
            color: t.color("pm.color.text.onAction"),
            borderRadius: t.dim("pm.radius.control"),
            minHeight: t.dim("pm.size.control.md"),
            padding: `0 ${t.dim("pm.space.md")}`,
            border: "none",
            cursor: props.disabled ? "not-allowed" : "pointer",
            ...t.typography("pm.typography.label"),
          },
        },
        props.label,
      );
  },
});
