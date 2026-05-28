import type { NormalizedSnapshot, NormalizedValue } from "./types.js";

export interface ParityMismatch {
  name: string;
  left: NormalizedValue | undefined;
  right: NormalizedValue | undefined;
}

const sameNumber = (a: number, b: number, epsilon = 1e-9): boolean => Math.abs(a - b) <= epsilon;

function sameValue(a: NormalizedValue, b: NormalizedValue): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "color":
      return a.hex === (b as typeof a).hex;
    case "dimension":
      return sameNumber(a.px, (b as typeof a).px);
    case "number":
      return sameNumber(a.n, (b as typeof a).n);
    case "duration":
      return a.ms === (b as typeof a).ms;
    case "cubicBezier": {
      const r = (b as typeof a).values;
      return a.values.every((v, i) => sameNumber(v, r[i]!));
    }
    case "typography": {
      const r = b as typeof a;
      return (
        a.family === r.family &&
        a.weight === r.weight &&
        sameNumber(a.fontSizePx, r.fontSizePx) &&
        sameNumber(a.lineHeight, r.lineHeight) &&
        sameNumber(a.letterSpacingPx, r.letterSpacingPx)
      );
    }
    case "shadow": {
      const r = (b as typeof a).shadows;
      if (a.shadows.length !== r.length) return false;
      return a.shadows.every((s, i) => {
        const o = r[i]!;
        return s.hex === o.hex && sameNumber(s.xPx, o.xPx) && sameNumber(s.yPx, o.yPx) && sameNumber(s.blurPx, o.blurPx);
      });
    }
  }
}

/**
 * Compare two normalized snapshots. Returns the names whose values disagree (or where one side
 * is missing a name the other has). Equal snapshots return an empty array.
 */
export function diffSnapshots(left: NormalizedSnapshot, right: NormalizedSnapshot): ParityMismatch[] {
  const out: ParityMismatch[] = [];
  const names = new Set([...left.keys(), ...right.keys()]);
  for (const name of names) {
    const a = left.get(name);
    const b = right.get(name);
    if (a === undefined || b === undefined) {
      out.push({ name, left: a, right: b });
      continue;
    }
    if (!sameValue(a, b)) out.push({ name, left: a, right: b });
  }
  return out;
}
