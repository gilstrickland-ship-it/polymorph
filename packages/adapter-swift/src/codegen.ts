import { resolveTheme } from "@polymorph/core";
import { TOKENS, COMPONENT_ROLES, type ThemeMode, type ResolvedTheme } from "@polymorph/spec";
import {
  colorToSwift,
  cubicBezierToSwift,
  dimToSwift,
  durationToSwift,
  idToSwiftName,
  componentPropSwiftName,
  numberToSwift,
  shadowToSwift,
  typographyToSwift,
} from "./swift.js";

export interface TransformOptions {
  /** Top-level enum name (Swift enums are common for static-namespace types). Default: "PolymorphTheme". */
  enumName?: string;
  /** Mode to render. Default: "light". */
  mode?: ThemeMode;
}

/**
 * Convert a Polymorph theme JSON to a Swift source string. The output declares a single
 * top-level `enum` (used as a namespace) with `public static let` per resolved semantic and
 * component token, typed `Color` / `CGFloat` / `Double` / `TimeInterval` /
 * `(Double,Double,Double,Double)` / `PolymorphTextStyle` / `[PolymorphShadow]`.
 *
 * Two small helper structs (`PolymorphTextStyle` and `PolymorphShadow`) are emitted at the top
 * so the generated file is self-contained — apps don't need to depend on a Polymorph runtime
 * package. Drop the file into an SwiftUI/iOS project and import it.
 */
export function transformToSwift(theme: unknown, options: TransformOptions = {}): string {
  const mode = options.mode ?? "light";
  const enumName = options.enumName ?? "PolymorphTheme";
  const rt = resolveTheme(theme, mode);
  return emit(rt, enumName, mode);
}

/** Lower-level: emit from an already-resolved theme (skip the resolve step). */
export function emitSwiftFromResolved(resolved: ResolvedTheme, options: TransformOptions = {}): string {
  const enumName = options.enumName ?? "PolymorphTheme";
  return emit(resolved, enumName, resolved.mode);
}

// --- emitter -----------------------------------------------------------------

interface Entry {
  name: string;
  type: string;
  literal: string;
}

function emit(rt: ResolvedTheme, enumName: string, mode: string): string {
  const colors: Entry[] = [];
  const dims: Entry[] = [];
  const numbers: Entry[] = [];
  const durations: Entry[] = [];
  const easings: Entry[] = [];
  const typos: Entry[] = [];
  const shadows: Entry[] = [];
  const components: Entry[] = [];
  const skipped: string[] = [];

  type Tokens = Record<string, { $type: string; value: unknown } | undefined>;
  const tokens = rt.tokens as Tokens;

  for (const t of TOKENS) {
    const node = tokens[t.id];
    if (!node) continue;
    const name = idToSwiftName(t.id);
    const lit = emitValue(t.type, node.value);
    if (!lit) {
      skipped.push(`${t.id} (${t.type})`);
      continue;
    }
    const entry: Entry = { name, type: swiftTypeFor(t.type), literal: lit };
    switch (t.type) {
      case "color":
        colors.push(entry);
        break;
      case "dimension":
        dims.push(entry);
        break;
      case "number":
        numbers.push(entry);
        break;
      case "duration":
        durations.push(entry);
        break;
      case "cubicBezier":
        easings.push(entry);
        break;
      case "typography":
        typos.push(entry);
        break;
      case "shadow":
        shadows.push(entry);
        break;
      default:
        skipped.push(`${t.id} (${t.type})`);
    }
  }

  const typeOfId = new Map(TOKENS.map((t) => [t.id, t.type]));
  type Comps = Record<string, Record<string, unknown> | undefined>;
  const comps = rt.components as Comps;
  for (const role of COMPONENT_ROLES) {
    const props = comps[role.role];
    if (!props) continue;
    for (const p of role.properties) {
      const v = props[p.property];
      if (v === undefined) continue;
      const dtcgType = typeOfId.get(p.defaultsFrom);
      if (!dtcgType) continue;
      const lit = emitValue(dtcgType, v);
      if (!lit) {
        skipped.push(`${role.role}.${p.property} (${dtcgType})`);
        continue;
      }
      components.push({
        name: componentPropSwiftName(role.role, p.property),
        type: swiftTypeFor(dtcgType),
        literal: lit,
      });
    }
  }

  const section = (title: string, entries: Entry[]): string => {
    if (entries.length === 0) return "";
    const body = entries
      .map((e) => `  public static let ${e.name}: ${e.type} = ${e.literal}`)
      .join("\n");
    return `\n  // MARK: - ${title}\n${body}\n`;
  };

  const skippedComment = skipped.length === 0 ? "" : `\n  // Skipped (unsupported in v1): ${skipped.slice(0, 8).join(", ")}${skipped.length > 8 ? `, +${skipped.length - 8} more` : ""}.\n`;

  return `${header(enumName, mode, rt.contractVersion)}
import SwiftUI

${helperTypes()}

/// Polymorph theme — generated from contract v${rt.contractVersion}, mode "${mode}".
public enum ${enumName} {
${section("Colors", colors)}${section("Dimensions / spacing / radii / sizes", dims)}${section("Numbers / opacities", numbers)}${section("Motion (durations + easings)", [...durations, ...easings])}${section("Typography", typos)}${section("Shadows", shadows)}${section("Component tokens (override resolved)", components)}${skippedComment}}
`;
}

function header(enumName: string, mode: string, contractVersion: string): string {
  return [
    `// AUTO-GENERATED by @polymorph/adapter-swift — DO NOT EDIT.`,
    `// Source: contract version ${contractVersion}, mode "${mode}".`,
    `// Regenerate by running the CLI's transform command or update-goldens script.`,
    `// Generated enum: ${enumName}.`,
  ].join("\n");
}

/** Self-contained helper structs so the emitted file has no external Polymorph dependency. */
function helperTypes(): string {
  return `/// Container for a Polymorph typography composite. Apply via a small SwiftUI extension:
///   Text("…").font(style.font).lineSpacing(style.lineHeight - 1.0).tracking(style.letterSpacing)
public struct PolymorphTextStyle {
  public let font: Font
  public let fontSize: CGFloat
  public let weight: Font.Weight
  public let lineHeight: CGFloat
  public let letterSpacing: CGFloat
  public init(font: Font, fontSize: CGFloat, weight: Font.Weight, lineHeight: CGFloat, letterSpacing: CGFloat) {
    self.font = font
    self.fontSize = fontSize
    self.weight = weight
    self.lineHeight = lineHeight
    self.letterSpacing = letterSpacing
  }
}

/// Container for a Polymorph shadow. Apply via .shadow(color: s.color, radius: s.radius, x: s.x, y: s.y).
public struct PolymorphShadow {
  public let color: Color
  public let x: CGFloat
  public let y: CGFloat
  public let radius: CGFloat
  public init(color: Color, x: CGFloat, y: CGFloat, radius: CGFloat) {
    self.color = color
    self.x = x
    self.y = y
    self.radius = radius
  }
}`;
}

function emitValue(type: string, value: unknown): string | null {
  switch (type) {
    case "color":
      return colorToSwift(value);
    case "dimension":
      return dimToSwift(value);
    case "number":
      return numberToSwift(value);
    case "duration":
      return durationToSwift(value);
    case "cubicBezier":
      return cubicBezierToSwift(value);
    case "typography":
      return typographyToSwift(value);
    case "shadow":
      return shadowToSwift(value);
    default:
      return null;
  }
}

function swiftTypeFor(type: string): string {
  switch (type) {
    case "color":
      return "Color";
    case "dimension":
      return "CGFloat";
    case "number":
      return "Double";
    case "duration":
      return "TimeInterval";
    case "cubicBezier":
      return "(Double, Double, Double, Double)";
    case "typography":
      return "PolymorphTextStyle";
    case "shadow":
      return "[PolymorphShadow]";
    default:
      return "Any";
  }
}
