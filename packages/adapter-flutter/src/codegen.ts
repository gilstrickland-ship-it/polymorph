import { resolveTheme } from "@polymorph/core";
import { TOKENS, COMPONENT_ROLES, type ThemeMode, type ResolvedTheme } from "@polymorph/spec";
import {
  colorToDart,
  cubicBezierToDart,
  dimToDart,
  durationToDart,
  idToDartName,
  componentPropDartName,
  numberToDart,
  shadowToDart,
  typographyToDart,
} from "./dart.js";

export interface TransformOptions {
  /** Class name for the generated Dart class. Default: "PolymorphTheme". */
  className?: string;
  /** Mode to render. Default: "light". */
  mode?: ThemeMode;
  /** Map this Polymorph mode to a Flutter `Brightness.{light,dark}`. Default follows `mode`. */
  brightness?: "light" | "dark";
}

/**
 * Convert a Polymorph theme JSON to a Dart file string. The output declares a single class
 * (`PolymorphTheme` by default) with one `static const` per resolved semantic / component token
 * (typed `Color` / `double` / `Duration` / `Cubic` / `TextStyle` / `List<BoxShadow>`), plus a
 * `buildThemeData()` factory that maps those constants onto Flutter's `ThemeData`.
 *
 * The output is intentionally opinionated and human-readable so an FI's Dart developer can read
 * the file, understand it, and extend it. Regenerate after intentional theme changes.
 */
export function transformToDart(theme: unknown, options: TransformOptions = {}): string {
  const mode = options.mode ?? "light";
  const className = options.className ?? "PolymorphTheme";
  const brightness = options.brightness ?? mode === "dark" ? "dark" : "light";
  const rt = resolveTheme(theme, mode);
  return emit(rt, className, brightness, mode);
}

/** Lower-level: emit a class from an already-resolved theme (skip the resolve step). */
export function emitDartFromResolved(
  resolved: ResolvedTheme,
  options: TransformOptions = {},
): string {
  const className = options.className ?? "PolymorphTheme";
  const brightness = options.brightness ?? resolved.mode === "dark" ? "dark" : "light";
  return emit(resolved, className, brightness, resolved.mode);
}

// --- emitter -----------------------------------------------------------------

interface Entry {
  name: string;
  type: string;
  literal: string;
}

function emit(rt: ResolvedTheme, className: string, brightness: string, mode: string): string {
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

  // Iterate the manifest so the output ordering is stable and grouped by intent.
  for (const t of TOKENS) {
    const node = tokens[t.id];
    if (!node) continue;
    const name = idToDartName(t.id);
    const lit = emitValue(t.type, node.value);
    if (!lit) {
      skipped.push(`${t.id} (${t.type})`);
      continue;
    }
    const entry: Entry = { name, type: dartTypeFor(t.type), literal: lit };
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

  // Components: resolved.components[role][property] = concrete value. Type derived from the
  // defaultsFrom token's manifest type.
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
      components.push({ name: componentPropDartName(role.role, p.property), type: dartTypeFor(dtcgType), literal: lit });
    }
  }

  const section = (title: string, entries: Entry[]): string => {
    if (entries.length === 0) return "";
    const body = entries.map((e) => `  static const ${e.type} ${e.name} = ${e.literal};`).join("\n");
    return `\n  // ---- ${title} ${"-".repeat(Math.max(0, 70 - title.length))}\n${body}\n`;
  };

  const skippedComment = skipped.length === 0 ? "" : `\n  // Skipped (unsupported in v1): ${skipped.slice(0, 8).join(", ")}${skipped.length > 8 ? `, +${skipped.length - 8} more` : ""}.\n`;

  const themeDataBody = buildThemeDataBody(brightness);

  return `${header(className, mode, rt.contractVersion)}
import 'package:flutter/material.dart';
import 'package:flutter/animation.dart';

/// Polymorph theme — generated from contract v${rt.contractVersion}, mode "${mode}".
class ${className} {
${section("Colors", colors)}${section("Dimensions / spacing / radii / sizes", dims)}${section("Numbers / opacities", numbers)}${section("Motion (durations + easings)", [...durations, ...easings])}${section("Typography", typos)}${section("Shadows", shadows)}${section("Component tokens (override resolved)", components)}${skippedComment}
  /// Opinionated Material ThemeData starting point. Extend per app.
  static ThemeData buildThemeData() {
${themeDataBody}
  }
}
`;
}

function header(className: string, mode: string, contractVersion: string): string {
  return [
    `// AUTO-GENERATED by @polymorph/adapter-flutter — DO NOT EDIT.`,
    `// Source: contract version ${contractVersion}, mode "${mode}".`,
    `// Regenerate by running the CLI's transform command or update-goldens script.`,
    `// Generated class: ${className}.`,
    `// ignore_for_file: constant_identifier_names, prefer_const_constructors`,
  ].join("\n");
}

function emitValue(type: string, value: unknown): string | null {
  switch (type) {
    case "color":
      return colorToDart(value);
    case "dimension":
      return dimToDart(value);
    case "number":
      return numberToDart(value);
    case "duration":
      return durationToDart(value);
    case "cubicBezier":
      return cubicBezierToDart(value);
    case "typography":
      return typographyToDart(value);
    case "shadow":
      return shadowToDart(value);
    default:
      return null;
  }
}

function dartTypeFor(type: string): string {
  switch (type) {
    case "color":
      return "Color";
    case "dimension":
    case "number":
      return "double";
    case "duration":
      return "Duration";
    case "cubicBezier":
      return "Cubic";
    case "typography":
      return "TextStyle";
    case "shadow":
      return "List<BoxShadow>";
    default:
      return "Object";
  }
}

function buildThemeDataBody(brightness: string): string {
  // Opinionated mapping of Polymorph semantics → Material ThemeData fields. Conservative on
  // purpose: covers the high-value fields a typical Flutter app expects from a theme. Apps that
  // want more can read constants off the class directly.
  return `    return ThemeData(
      brightness: Brightness.${brightness},
      scaffoldBackgroundColor: colorSurfaceBase,
      canvasColor: colorSurfaceBase,
      cardColor: colorSurfaceRaised,
      dividerColor: colorBorderDefault,
      primaryColor: colorActionPrimaryRest,
      colorScheme: ColorScheme.${brightness === "dark" ? "dark" : "light"}(
        primary: colorActionPrimaryRest,
        onPrimary: colorTextOnAction,
        secondary: colorActionSecondaryRest,
        error: colorActionDangerRest,
        surface: colorSurfaceBase,
      ),
      textTheme: TextTheme(
        headlineMedium: typographyHeading,
        bodyLarge: typographyBody,
        labelLarge: typographyLabel,
        bodySmall: typographyCaption,
      ),
    );`;
}
