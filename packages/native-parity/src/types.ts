/**
 * A token's value in a target-language-independent canonical form. Channel-precision and
 * unit-system differences across targets (Swift's 0…1 RGB vs. Dart/Kotlin's `0xFFRRGGBB`,
 * Swift's `TimeInterval` seconds vs. Dart/Kotlin's millisecond literals) are erased.
 */
export type NormalizedValue =
  | { kind: "color"; hex: string } // "#rrggbb" (lowercase, no alpha)
  | { kind: "dimension"; px: number } // canonical px
  | { kind: "number"; n: number }
  | { kind: "duration"; ms: number } // milliseconds
  | { kind: "cubicBezier"; values: [number, number, number, number] }
  | {
      kind: "typography";
      family: string;
      weight: number; // 100…900
      fontSizePx: number;
      lineHeight: number;
      letterSpacingPx: number;
    }
  | {
      kind: "shadow";
      shadows: { hex: string; xPx: number; yPx: number; blurPx: number }[];
    };

/** A normalized snapshot of one generated source: `{ tokenName → NormalizedValue }`. */
export type NormalizedSnapshot = Map<string, NormalizedValue>;
