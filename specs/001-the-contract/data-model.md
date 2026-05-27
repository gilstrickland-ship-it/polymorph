# Phase 1 Data Model: The Contract

Entities are *data shapes and rules*, not runtime classes. They derive from the spec's Key
Entities and Requirements. TS type names are indicative; the canonical source is the vocabulary
manifest (research R7).

## Token (DTCG base)

A DTCG node with `$type`, `$value`, optional `$description`, optional `$extensions`. `$value` may
be a concrete value or a DTCG alias reference `{group.path.to.token}`.

- **Rules**: `$type` ∈ accepted subset (research R2). Alias references MUST resolve (FR-014).
- **States**: a token is *concrete* (literal `$value`) or *alias* (reference). Resolution
  flattens alias → concrete.

## PrimitiveToken

A raw, FI-specific Token living **outside** the `pm` group (any FI-chosen group, e.g.
`palette.*`, `scale.*`).

- **Fields**: standard DTCG (`$type`, `$value`, `$description`).
- **Rules**: MUST NOT use the reserved `pm` prefix (FR-003a). Referenced only by SemanticTokens;
  never referenced by SDK code.
- **Relationships**: target of SemanticToken aliases.

## SemanticToken (the contract surface)

A purpose-named contract Token under `pm.*` that SDKs code against.

- **Fields**: `id` (e.g. `pm.color.action.primary.rest`), `$type` (fixed by the manifest),
  `required` (bool), `modeSensitive` (bool), `group`, `$value` (in a theme: usually an alias to a
  PrimitiveToken).
- **Rules**:
  - `id` MUST be a manifest-recognized ID (unknown `pm.*` → warning per Edge Cases).
  - A theme MUST define every `required` SemanticToken in its default mode and every declared
    mode (FR-006).
  - `$type` of the theme's token MUST match the manifest's expected type (FR-005; type-mismatch →
    error).
  - Interactive states are distinct SemanticTokens via flat sub-IDs (e.g. `...primary.pressed`).
- **Relationships**: aliases → PrimitiveToken; may be the `defaultsFrom` target of a
  ComponentToken; appears as a key in ResolvedTheme.

## ComponentToken (optional override layer)

A role-scoped override addressed as `pm.<component>.<variant>.<property>`.

- **Fields**: `role` (e.g. `button.primary`), `property` (e.g. `radius`), `$value`,
  `defaultsFrom` (the SemanticToken used when omitted).
- **Rules**: entirely optional (FR-008); `role` MUST be in the closed v0 set (Appendix B / FR-010;
  unknown role → error); when omitted, resolution falls back to `defaultsFrom`.
- **Relationships**: `defaultsFrom` → SemanticToken; belongs to a ComponentRole.

## ComponentRole

A v0 closed-set entry (Appendix B): `button.primary`, `button.secondary`, `button.danger`,
`input`, `card`, `stepIndicator`, `disclosure`.

- **Fields**: `role`, `properties[]` each with its `defaultsFrom` SemanticToken.
- **Rules**: closed set in v0; new roles are additive (MINOR, FR-016).

## ThemeMode

Enum: `light` | `dark` | `highContrast`. `light` is required and is the default (FR-011).

- **Rules**: `dark`/`highContrast` optional; when present each provides the full required
  semantic set as its own per-mode token set (FR-003b/FR-012). Mode-invariant tokens
  (non-`modeSensitive`) are defined once and shared.

## ThemeFile

The unit an FI authors and ships (`*.tokens.json`).

- **Fields**: `$schema` (→ theme.schema.json), `contractVersion`, primitive groups,
  `pm` semantic/component groups, per-mode sets, optional `$extensions`.
- **Rules**: MUST validate against the JSON Schema **and** pass the programmatic checks
  (resolvable aliases, no cycles, per-mode completeness, no `pm` collision). MUST declare at least
  `light`.
- **Relationships**: composed of Primitive/Semantic/Component tokens across modes; resolves to a
  ResolvedTheme per mode.

## ResolvedTheme (neutral output — Principle IV)

The flattened result for one selected mode; produced by Spec B's resolver, **shape defined here**.

- **Shape**: a plain `Record<SemanticTokenId, ConcreteValue>` (+ resolved component overrides),
  framework- and component-model-neutral so any SDK (new or retrofit, FR-018-020) can read it.
- **Fields**: `mode`, `contractVersion`, `tokens` (semantic ID → concrete value with `$type`),
  `components` (role → resolved property values).
- **Rules**: contains **no aliases** (all resolved), **no primitives** as keys (only `pm.*`
  semantic/component IDs), no cycles. This is the only structure SDK/adapters consume.

## ContractVersion

Semver string attached to the manifest and to a ThemeFile.

- **Rules**: additive (optional token/role) → MINOR; new required token or rename/remove → MAJOR
  (FR-016). A ThemeFile valid under vX.Y stays valid under additive vX.(Y+1) (SC-004).

## Entity relationships (summary)

```text
ThemeFile
 ├── PrimitiveToken*          (non-pm groups)
 ├── SemanticToken*           (pm.*, alias → PrimitiveToken, per ThemeMode if modeSensitive)
 │     └── used-by → ComponentToken.defaultsFrom
 ├── ComponentToken*          (optional; role ∈ ComponentRole closed set)
 └── declares → ThemeMode+    (light required)
        │
        ▼ (resolver, Spec B; select mode + flatten)
ResolvedTheme  =  Record<SemanticTokenId, ConcreteValue> + components   (neutral; SDK-consumable)
```
