import { resolveTheme } from "@polymorph/core";
import { TOKENS, COMPONENT_ROLES, type ThemeMode, type ResolvedTheme } from "@polymorph/spec";
import {
  colorToKotlin,
  cubicBezierToKotlin,
  dimToKotlin,
  durationToKotlin,
  idToKotlinName,
  componentPropKotlinName,
  numberToKotlin,
  shadowToKotlin,
  typographyToKotlin,
} from "./kotlin.js";

export interface TransformOptions {
  /** Top-level Kotlin `object` name. Default: "PolymorphTheme". */
  objectName?: string;
  /** Package declaration for the generated file. Default: "polymorph.theme". */
  packageName?: string;
  /** Mode to render. Default: "light". */
  mode?: ThemeMode;
}

/**
 * Convert a Polymorph theme JSON to a Kotlin source string. The output declares a single
 * top-level `object` (singleton namespace) with `val` per resolved semantic + component token,
 * typed `Color` / `Dp` / `Float` / `Int` (ms) / `CubicBezierEasing` / `PolymorphTextStyle` /
 * `List<PolymorphShadow>` for Jetpack Compose.
 *
 * Two helper data classes (`PolymorphTextStyle`, `PolymorphShadow`) are emitted at the top of
 * the file so the consumer's Android app has no external Polymorph dependency.
 */
export function transformToKotlin(theme: unknown, options: TransformOptions = {}): string {
  const mode = options.mode ?? "light";
  const objectName = options.objectName ?? "PolymorphTheme";
  const packageName = options.packageName ?? "polymorph.theme";
  const rt = resolveTheme(theme, mode);
  return emit(rt, objectName, packageName, mode);
}

/** Lower-level: emit from an already-resolved theme (skip the resolve step). */
export function emitKotlinFromResolved(resolved: ResolvedTheme, options: TransformOptions = {}): string {
  const objectName = options.objectName ?? "PolymorphTheme";
  const packageName = options.packageName ?? "polymorph.theme";
  return emit(resolved, objectName, packageName, resolved.mode);
}

// --- emitter -----------------------------------------------------------------

interface Entry {
  name: string;
  type: string;
  literal: string;
}

function emit(rt: ResolvedTheme, objectName: string, packageName: string, mode: string): string {
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
    const name = idToKotlinName(t.id);
    const lit = emitValue(t.type, node.value);
    if (!lit) {
      skipped.push(`${t.id} (${t.type})`);
      continue;
    }
    const entry: Entry = { name, type: kotlinTypeFor(t.type), literal: lit };
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
        name: componentPropKotlinName(role.role, p.property),
        type: kotlinTypeFor(dtcgType),
        literal: lit,
      });
    }
  }

  const section = (title: string, entries: Entry[]): string => {
    if (entries.length === 0) return "";
    const body = entries.map((e) => `  val ${e.name}: ${e.type} = ${e.literal}`).join("\n");
    return `\n  // region ${title}\n${body}\n  // endregion\n`;
  };

  const skippedComment = skipped.length === 0 ? "" : `\n  // Skipped (unsupported in v1): ${skipped.slice(0, 8).join(", ")}${skipped.length > 8 ? `, +${skipped.length - 8} more` : ""}.\n`;

  return `${header(objectName, mode, rt.contractVersion)}
package ${packageName}

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

${helperTypes()}

/** Polymorph theme — generated from contract v${rt.contractVersion}, mode "${mode}". */
object ${objectName} {
${section("Colors", colors)}${section("Dimensions / spacing / radii / sizes", dims)}${section("Numbers / opacities", numbers)}${section("Motion (durations + easings)", [...durations, ...easings])}${section("Typography", typos)}${section("Shadows", shadows)}${section("Component tokens (override resolved)", components)}${skippedComment}}
`;
}

function header(objectName: string, mode: string, contractVersion: string): string {
  return [
    `// AUTO-GENERATED by @polymorph/adapter-kotlin — DO NOT EDIT.`,
    `// Source: contract version ${contractVersion}, mode "${mode}".`,
    `// Regenerate by running the CLI's transform command or update-goldens script.`,
    `// Generated object: ${objectName}.`,
  ].join("\n");
}

/** Self-contained helper data classes so the emitted file has no external Polymorph dependency. */
function helperTypes(): string {
  return `/**
 * Container for a Polymorph typography composite. Apply by constructing a Compose [TextStyle]:
 *   TextStyle(fontSize = style.fontSize, fontWeight = style.fontWeight, ...)
 */
data class PolymorphTextStyle(
  val fontFamily: String,
  val fontSize: TextUnit,
  val fontWeight: FontWeight,
  val lineHeight: Float,
  val letterSpacing: TextUnit,
)

/** Container for a Polymorph shadow. Apply via Modifier.shadow / drawBehind in Compose. */
data class PolymorphShadow(
  val color: Color,
  val x: Dp,
  val y: Dp,
  val radius: Dp,
)`;
}

function emitValue(type: string, value: unknown): string | null {
  switch (type) {
    case "color":
      return colorToKotlin(value);
    case "dimension":
      return dimToKotlin(value);
    case "number":
      return numberToKotlin(value);
    case "duration":
      return durationToKotlin(value);
    case "cubicBezier":
      return cubicBezierToKotlin(value);
    case "typography":
      return typographyToKotlin(value);
    case "shadow":
      return shadowToKotlin(value);
    default:
      return null;
  }
}

function kotlinTypeFor(type: string): string {
  switch (type) {
    case "color":
      return "Color";
    case "dimension":
      return "Dp";
    case "number":
      return "Float";
    case "duration":
      return "Int";
    case "cubicBezier":
      return "CubicBezierEasing";
    case "typography":
      return "PolymorphTextStyle";
    case "shadow":
      return "List<PolymorphShadow>";
    default:
      return "Any";
  }
}
