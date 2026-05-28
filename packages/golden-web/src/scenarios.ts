import type { SemanticTokenId } from "@polymorph/spec";

/** A Satori-compatible node. Loose by design — Satori validates style support at render time. */
export interface SatoriNode {
  type: string;
  props: { style?: Record<string, unknown>; children?: SatoriNode | string | Array<SatoriNode | string>; [k: string]: unknown };
}

export interface WebGoldenScenario {
  /** Stable name used to derive baseline filenames. */
  readonly name: string;
  readonly width: number;
  readonly height: number;
  /** Build the render tree from a `toTokenMap(resolved)` record. */
  build(tokens: Readonly<Record<SemanticTokenId, unknown>>): SatoriNode;
}

const dim = (tokens: Readonly<Record<string, unknown>>, id: SemanticTokenId): number => {
  const v = tokens[id];
  if (v && typeof v === "object" && "value" in v && typeof (v as { value: unknown }).value === "number") {
    return (v as { value: number }).value;
  }
  return 0;
};
const color = (tokens: Readonly<Record<string, unknown>>, id: SemanticTokenId): string => {
  const v = tokens[id];
  return typeof v === "string" ? v : "#000";
};

/**
 * Default scenario: a small "open an account" card that exercises the bank-distinguishing tokens
 * (surface colors, action color, radii, spacing). Same tree for every theme; differences in the
 * resolved tokens drive the visible re-skin.
 */
export const accountCardScenario: WebGoldenScenario = {
  name: "account-card",
  width: 400,
  height: 300,
  build(tokens) {
    const lg = dim(tokens, "pm.space.lg");
    const md = dim(tokens, "pm.space.md");
    const sm = dim(tokens, "pm.space.sm");
    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          width: 400,
          height: 300,
          backgroundColor: color(tokens, "pm.color.surface.base"),
          padding: lg,
          gap: md,
          fontFamily: "Inter",
        },
        children: [
          {
            type: "div",
            props: {
              style: { fontSize: 24, fontWeight: 700, color: color(tokens, "pm.color.text.body") },
              children: "Open your account",
            },
          },
          {
            type: "div",
            props: {
              style: { fontSize: 14, color: color(tokens, "pm.color.text.muted") },
              children: "Two minutes to get started.",
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                backgroundColor: color(tokens, "pm.color.surface.raised"),
                borderRadius: dim(tokens, "pm.radius.card"),
                padding: md,
                gap: sm,
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { fontSize: 14, color: color(tokens, "pm.color.text.body") },
                    children: "Continue to verify your identity.",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignSelf: "flex-start",
                      backgroundColor: color(tokens, "pm.color.action.primary.rest"),
                      color: color(tokens, "pm.color.text.onAction"),
                      borderRadius: dim(tokens, "pm.radius.control"),
                      padding: `${sm}px ${md}px`,
                      fontSize: 14,
                      fontWeight: 600,
                    },
                    children: "Continue",
                  },
                },
              ],
            },
          },
        ],
      },
    };
  },
};

export const DEFAULT_SCENARIOS: readonly WebGoldenScenario[] = [accountCardScenario];
