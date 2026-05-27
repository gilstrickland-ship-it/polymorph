// AUTO-GENERATED from manifest/semantic-vocabulary.v0.json — DO NOT EDIT.
// Run `pnpm --filter @polymorph/spec generate` to regenerate.

export type TokenType =
  | "color"
  | "cubicBezier"
  | "dimension"
  | "duration"
  | "number"
  | "shadow"
  | "typography";

export type SemanticTokenId =
  | "pm.color.surface.base"
  | "pm.color.surface.raised"
  | "pm.color.surface.sunken"
  | "pm.color.surface.overlay"
  | "pm.color.surface.inverse"
  | "pm.color.text.body"
  | "pm.color.text.muted"
  | "pm.color.text.subtle"
  | "pm.color.text.onAction"
  | "pm.color.text.onInverse"
  | "pm.color.text.link"
  | "pm.color.text.disabled"
  | "pm.color.action.primary.rest"
  | "pm.color.action.primary.hover"
  | "pm.color.action.primary.pressed"
  | "pm.color.action.primary.disabled"
  | "pm.color.action.secondary.rest"
  | "pm.color.action.secondary.pressed"
  | "pm.color.action.danger.rest"
  | "pm.color.action.danger.pressed"
  | "pm.color.feedback.success"
  | "pm.color.feedback.warning"
  | "pm.color.feedback.error"
  | "pm.color.feedback.info"
  | "pm.color.border.default"
  | "pm.color.border.subtle"
  | "pm.color.border.strong"
  | "pm.color.border.focus"
  | "pm.typography.display"
  | "pm.typography.heading"
  | "pm.typography.headingSm"
  | "pm.typography.body"
  | "pm.typography.bodyStrong"
  | "pm.typography.label"
  | "pm.typography.caption"
  | "pm.typography.mono"
  | "pm.space.none"
  | "pm.space.xs"
  | "pm.space.sm"
  | "pm.space.md"
  | "pm.space.lg"
  | "pm.space.xl"
  | "pm.space.2xl"
  | "pm.space.3xl"
  | "pm.radius.none"
  | "pm.radius.control"
  | "pm.radius.card"
  | "pm.radius.pill"
  | "pm.radius.full"
  | "pm.border.width.hairline"
  | "pm.border.width.thin"
  | "pm.border.width.thick"
  | "pm.elevation.flat"
  | "pm.elevation.raised"
  | "pm.elevation.overlay"
  | "pm.opacity.disabled"
  | "pm.opacity.muted"
  | "pm.opacity.scrim"
  | "pm.motion.duration.short"
  | "pm.motion.duration.base"
  | "pm.motion.duration.long"
  | "pm.motion.easing.standard"
  | "pm.motion.easing.emphasized"
  | "pm.size.control.sm"
  | "pm.size.control.md"
  | "pm.size.control.lg"
  | "pm.size.touchTarget.min"
  | "pm.size.icon.md";

export type ComponentRole =
  | "button.primary"
  | "button.secondary"
  | "button.danger"
  | "input"
  | "card"
  | "stepIndicator"
  | "disclosure";

export interface ManifestTokenEntry {
  id: SemanticTokenId;
  type: TokenType;
  required: boolean;
  modeSensitive: boolean;
  group: string;
}

export interface ComponentRoleEntry {
  role: ComponentRole;
  properties: ReadonlyArray<{ property: string; defaultsFrom: SemanticTokenId }>;
}

export const CONTRACT_VERSION = "0.0.0";
export const DTCG_BASE_VERSION = "2025.10";
export const DEFAULT_MODE = "light";
export const SUPPORTED_MODES = [
  "light",
  "dark",
  "highContrast",
] as const;

export const ALL_TOKEN_IDS: readonly SemanticTokenId[] = [
  "pm.color.surface.base",
  "pm.color.surface.raised",
  "pm.color.surface.sunken",
  "pm.color.surface.overlay",
  "pm.color.surface.inverse",
  "pm.color.text.body",
  "pm.color.text.muted",
  "pm.color.text.subtle",
  "pm.color.text.onAction",
  "pm.color.text.onInverse",
  "pm.color.text.link",
  "pm.color.text.disabled",
  "pm.color.action.primary.rest",
  "pm.color.action.primary.hover",
  "pm.color.action.primary.pressed",
  "pm.color.action.primary.disabled",
  "pm.color.action.secondary.rest",
  "pm.color.action.secondary.pressed",
  "pm.color.action.danger.rest",
  "pm.color.action.danger.pressed",
  "pm.color.feedback.success",
  "pm.color.feedback.warning",
  "pm.color.feedback.error",
  "pm.color.feedback.info",
  "pm.color.border.default",
  "pm.color.border.subtle",
  "pm.color.border.strong",
  "pm.color.border.focus",
  "pm.typography.display",
  "pm.typography.heading",
  "pm.typography.headingSm",
  "pm.typography.body",
  "pm.typography.bodyStrong",
  "pm.typography.label",
  "pm.typography.caption",
  "pm.typography.mono",
  "pm.space.none",
  "pm.space.xs",
  "pm.space.sm",
  "pm.space.md",
  "pm.space.lg",
  "pm.space.xl",
  "pm.space.2xl",
  "pm.space.3xl",
  "pm.radius.none",
  "pm.radius.control",
  "pm.radius.card",
  "pm.radius.pill",
  "pm.radius.full",
  "pm.border.width.hairline",
  "pm.border.width.thin",
  "pm.border.width.thick",
  "pm.elevation.flat",
  "pm.elevation.raised",
  "pm.elevation.overlay",
  "pm.opacity.disabled",
  "pm.opacity.muted",
  "pm.opacity.scrim",
  "pm.motion.duration.short",
  "pm.motion.duration.base",
  "pm.motion.duration.long",
  "pm.motion.easing.standard",
  "pm.motion.easing.emphasized",
  "pm.size.control.sm",
  "pm.size.control.md",
  "pm.size.control.lg",
  "pm.size.touchTarget.min",
  "pm.size.icon.md",
];

export const REQUIRED_TOKEN_IDS: readonly SemanticTokenId[] = [
  "pm.color.surface.base",
  "pm.color.surface.raised",
  "pm.color.text.body",
  "pm.color.text.muted",
  "pm.color.text.onAction",
  "pm.color.text.link",
  "pm.color.text.disabled",
  "pm.color.action.primary.rest",
  "pm.color.action.primary.pressed",
  "pm.color.action.primary.disabled",
  "pm.color.action.secondary.rest",
  "pm.color.action.danger.rest",
  "pm.color.feedback.success",
  "pm.color.feedback.warning",
  "pm.color.feedback.error",
  "pm.color.border.default",
  "pm.color.border.focus",
  "pm.typography.heading",
  "pm.typography.body",
  "pm.typography.label",
  "pm.typography.caption",
  "pm.space.none",
  "pm.space.xs",
  "pm.space.sm",
  "pm.space.md",
  "pm.space.lg",
  "pm.space.xl",
  "pm.radius.none",
  "pm.radius.control",
  "pm.radius.card",
  "pm.border.width.hairline",
  "pm.border.width.thin",
  "pm.elevation.flat",
  "pm.elevation.raised",
  "pm.opacity.disabled",
  "pm.motion.duration.short",
  "pm.motion.duration.base",
  "pm.motion.easing.standard",
  "pm.size.control.md",
  "pm.size.touchTarget.min",
  "pm.size.icon.md",
];

export const MODE_SENSITIVE_TOKEN_IDS: readonly SemanticTokenId[] = [
  "pm.color.surface.base",
  "pm.color.surface.raised",
  "pm.color.surface.sunken",
  "pm.color.surface.overlay",
  "pm.color.surface.inverse",
  "pm.color.text.body",
  "pm.color.text.muted",
  "pm.color.text.subtle",
  "pm.color.text.onAction",
  "pm.color.text.onInverse",
  "pm.color.text.link",
  "pm.color.text.disabled",
  "pm.color.action.primary.rest",
  "pm.color.action.primary.hover",
  "pm.color.action.primary.pressed",
  "pm.color.action.primary.disabled",
  "pm.color.action.secondary.rest",
  "pm.color.action.secondary.pressed",
  "pm.color.action.danger.rest",
  "pm.color.action.danger.pressed",
  "pm.color.feedback.success",
  "pm.color.feedback.warning",
  "pm.color.feedback.error",
  "pm.color.feedback.info",
  "pm.color.border.default",
  "pm.color.border.subtle",
  "pm.color.border.strong",
  "pm.color.border.focus",
  "pm.elevation.flat",
  "pm.elevation.raised",
  "pm.elevation.overlay",
];

export const TOKENS: readonly ManifestTokenEntry[] = [
  {
    "id": "pm.color.surface.base",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.surface"
  },
  {
    "id": "pm.color.surface.raised",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.surface"
  },
  {
    "id": "pm.color.surface.sunken",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.surface"
  },
  {
    "id": "pm.color.surface.overlay",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.surface"
  },
  {
    "id": "pm.color.surface.inverse",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.surface"
  },
  {
    "id": "pm.color.text.body",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.text"
  },
  {
    "id": "pm.color.text.muted",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.text"
  },
  {
    "id": "pm.color.text.subtle",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.text"
  },
  {
    "id": "pm.color.text.onAction",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.text"
  },
  {
    "id": "pm.color.text.onInverse",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.text"
  },
  {
    "id": "pm.color.text.link",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.text"
  },
  {
    "id": "pm.color.text.disabled",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.text"
  },
  {
    "id": "pm.color.action.primary.rest",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.action.primary"
  },
  {
    "id": "pm.color.action.primary.hover",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.action.primary"
  },
  {
    "id": "pm.color.action.primary.pressed",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.action.primary"
  },
  {
    "id": "pm.color.action.primary.disabled",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.action.primary"
  },
  {
    "id": "pm.color.action.secondary.rest",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.action.secondary"
  },
  {
    "id": "pm.color.action.secondary.pressed",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.action.secondary"
  },
  {
    "id": "pm.color.action.danger.rest",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.action.danger"
  },
  {
    "id": "pm.color.action.danger.pressed",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.action.danger"
  },
  {
    "id": "pm.color.feedback.success",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.feedback"
  },
  {
    "id": "pm.color.feedback.warning",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.feedback"
  },
  {
    "id": "pm.color.feedback.error",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.feedback"
  },
  {
    "id": "pm.color.feedback.info",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.feedback"
  },
  {
    "id": "pm.color.border.default",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.border"
  },
  {
    "id": "pm.color.border.subtle",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.border"
  },
  {
    "id": "pm.color.border.strong",
    "type": "color",
    "required": false,
    "modeSensitive": true,
    "group": "color.border"
  },
  {
    "id": "pm.color.border.focus",
    "type": "color",
    "required": true,
    "modeSensitive": true,
    "group": "color.border"
  },
  {
    "id": "pm.typography.display",
    "type": "typography",
    "required": false,
    "modeSensitive": false,
    "group": "typography"
  },
  {
    "id": "pm.typography.heading",
    "type": "typography",
    "required": true,
    "modeSensitive": false,
    "group": "typography"
  },
  {
    "id": "pm.typography.headingSm",
    "type": "typography",
    "required": false,
    "modeSensitive": false,
    "group": "typography"
  },
  {
    "id": "pm.typography.body",
    "type": "typography",
    "required": true,
    "modeSensitive": false,
    "group": "typography"
  },
  {
    "id": "pm.typography.bodyStrong",
    "type": "typography",
    "required": false,
    "modeSensitive": false,
    "group": "typography"
  },
  {
    "id": "pm.typography.label",
    "type": "typography",
    "required": true,
    "modeSensitive": false,
    "group": "typography"
  },
  {
    "id": "pm.typography.caption",
    "type": "typography",
    "required": true,
    "modeSensitive": false,
    "group": "typography"
  },
  {
    "id": "pm.typography.mono",
    "type": "typography",
    "required": false,
    "modeSensitive": false,
    "group": "typography"
  },
  {
    "id": "pm.space.none",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "space"
  },
  {
    "id": "pm.space.xs",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "space"
  },
  {
    "id": "pm.space.sm",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "space"
  },
  {
    "id": "pm.space.md",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "space"
  },
  {
    "id": "pm.space.lg",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "space"
  },
  {
    "id": "pm.space.xl",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "space"
  },
  {
    "id": "pm.space.2xl",
    "type": "dimension",
    "required": false,
    "modeSensitive": false,
    "group": "space"
  },
  {
    "id": "pm.space.3xl",
    "type": "dimension",
    "required": false,
    "modeSensitive": false,
    "group": "space"
  },
  {
    "id": "pm.radius.none",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "radius"
  },
  {
    "id": "pm.radius.control",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "radius"
  },
  {
    "id": "pm.radius.card",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "radius"
  },
  {
    "id": "pm.radius.pill",
    "type": "dimension",
    "required": false,
    "modeSensitive": false,
    "group": "radius"
  },
  {
    "id": "pm.radius.full",
    "type": "dimension",
    "required": false,
    "modeSensitive": false,
    "group": "radius"
  },
  {
    "id": "pm.border.width.hairline",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "border.width"
  },
  {
    "id": "pm.border.width.thin",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "border.width"
  },
  {
    "id": "pm.border.width.thick",
    "type": "dimension",
    "required": false,
    "modeSensitive": false,
    "group": "border.width"
  },
  {
    "id": "pm.elevation.flat",
    "type": "shadow",
    "required": true,
    "modeSensitive": true,
    "group": "elevation"
  },
  {
    "id": "pm.elevation.raised",
    "type": "shadow",
    "required": true,
    "modeSensitive": true,
    "group": "elevation"
  },
  {
    "id": "pm.elevation.overlay",
    "type": "shadow",
    "required": false,
    "modeSensitive": true,
    "group": "elevation"
  },
  {
    "id": "pm.opacity.disabled",
    "type": "number",
    "required": true,
    "modeSensitive": false,
    "group": "opacity"
  },
  {
    "id": "pm.opacity.muted",
    "type": "number",
    "required": false,
    "modeSensitive": false,
    "group": "opacity"
  },
  {
    "id": "pm.opacity.scrim",
    "type": "number",
    "required": false,
    "modeSensitive": false,
    "group": "opacity"
  },
  {
    "id": "pm.motion.duration.short",
    "type": "duration",
    "required": true,
    "modeSensitive": false,
    "group": "motion.duration"
  },
  {
    "id": "pm.motion.duration.base",
    "type": "duration",
    "required": true,
    "modeSensitive": false,
    "group": "motion.duration"
  },
  {
    "id": "pm.motion.duration.long",
    "type": "duration",
    "required": false,
    "modeSensitive": false,
    "group": "motion.duration"
  },
  {
    "id": "pm.motion.easing.standard",
    "type": "cubicBezier",
    "required": true,
    "modeSensitive": false,
    "group": "motion.easing"
  },
  {
    "id": "pm.motion.easing.emphasized",
    "type": "cubicBezier",
    "required": false,
    "modeSensitive": false,
    "group": "motion.easing"
  },
  {
    "id": "pm.size.control.sm",
    "type": "dimension",
    "required": false,
    "modeSensitive": false,
    "group": "size.control"
  },
  {
    "id": "pm.size.control.md",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "size.control"
  },
  {
    "id": "pm.size.control.lg",
    "type": "dimension",
    "required": false,
    "modeSensitive": false,
    "group": "size.control"
  },
  {
    "id": "pm.size.touchTarget.min",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "size.touchTarget"
  },
  {
    "id": "pm.size.icon.md",
    "type": "dimension",
    "required": true,
    "modeSensitive": false,
    "group": "size.icon"
  }
] as const;

export const COMPONENT_ROLES: readonly ComponentRoleEntry[] = [
  {
    "role": "button.primary",
    "properties": [
      {
        "property": "background",
        "defaultsFrom": "pm.color.action.primary.rest"
      },
      {
        "property": "foreground",
        "defaultsFrom": "pm.color.text.onAction"
      },
      {
        "property": "radius",
        "defaultsFrom": "pm.radius.control"
      }
    ]
  },
  {
    "role": "button.secondary",
    "properties": [
      {
        "property": "background",
        "defaultsFrom": "pm.color.action.secondary.rest"
      },
      {
        "property": "border",
        "defaultsFrom": "pm.color.action.secondary.rest"
      },
      {
        "property": "foreground",
        "defaultsFrom": "pm.color.text.body"
      }
    ]
  },
  {
    "role": "button.danger",
    "properties": [
      {
        "property": "background",
        "defaultsFrom": "pm.color.action.danger.rest"
      },
      {
        "property": "foreground",
        "defaultsFrom": "pm.color.text.onAction"
      }
    ]
  },
  {
    "role": "input",
    "properties": [
      {
        "property": "background",
        "defaultsFrom": "pm.color.surface.raised"
      },
      {
        "property": "border",
        "defaultsFrom": "pm.color.border.default"
      },
      {
        "property": "borderFocus",
        "defaultsFrom": "pm.color.border.focus"
      },
      {
        "property": "foreground",
        "defaultsFrom": "pm.color.text.body"
      },
      {
        "property": "radius",
        "defaultsFrom": "pm.radius.control"
      }
    ]
  },
  {
    "role": "card",
    "properties": [
      {
        "property": "background",
        "defaultsFrom": "pm.color.surface.raised"
      },
      {
        "property": "radius",
        "defaultsFrom": "pm.radius.card"
      },
      {
        "property": "elevation",
        "defaultsFrom": "pm.elevation.raised"
      }
    ]
  },
  {
    "role": "stepIndicator",
    "properties": [
      {
        "property": "activeColor",
        "defaultsFrom": "pm.color.action.primary.rest"
      },
      {
        "property": "inactiveColor",
        "defaultsFrom": "pm.color.border.default"
      }
    ]
  },
  {
    "role": "disclosure",
    "properties": [
      {
        "property": "foreground",
        "defaultsFrom": "pm.color.text.muted"
      },
      {
        "property": "typography",
        "defaultsFrom": "pm.typography.caption"
      }
    ]
  }
] as const;
