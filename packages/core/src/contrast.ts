// Pure WCAG 2.1 contrast utilities. Supports sRGB hex and rgb()/rgba(); other CSS Color 4
// forms (oklch, color(...)) are intentionally unsupported here and surface as "unparseable".

type RGB = [number, number, number];

export function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();

  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    const h = hex[1]!;
    if (h.length === 3 || h.length === 4) {
      return [h[0]!, h[1]!, h[2]!].map((c) => parseInt(c + c, 16)) as RGB;
    }
    if (h.length === 6 || h.length === 8) {
      return [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map((c) => parseInt(c, 16)) as RGB;
    }
    return null;
  }

  const rgb = s.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1]!.split(/[,/]/).map((p) => p.trim());
    if (parts.length < 3) return null;
    const channel = (p: string): number | null => {
      if (p.endsWith("%")) return Math.round((parseFloat(p) / 100) * 255);
      const n = Number(p);
      return Number.isFinite(n) ? n : null;
    };
    const r = channel(parts[0]!);
    const g = channel(parts[1]!);
    const b = channel(parts[2]!);
    if (r === null || g === null || b === null) return null;
    if ([r, g, b].some((c) => c < 0 || c > 255)) return null;
    return [r, g, b];
  }

  return null;
}

function relativeLuminance([r, g, b]: RGB): number {
  const lin = (c: number): number => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.1 contrast ratio (1..21). Throws if either color is unparseable. */
export function contrastRatio(a: string, b: string): number {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca) throw new Error(`unparseable color: ${a}`);
  if (!cb) throw new Error(`unparseable color: ${b}`);
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
