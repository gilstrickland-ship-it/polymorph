# Feature Specification: The Contract

**Spec ID**: 001-the-contract

**Created**: 2026-05-27

**Status**: Draft (awaiting review)

**Input**: Spec A from the approved Polymorph plan — define the DTCG-extended theme **contract**:
the semantic vocabulary the SDK codes against, the four token layers, component-token and
theme-mode conventions, validation, and versioning rules. This is the first and most important
spec; the contract must stabilize before any adapter is built.

---

## Overview

The contract is the stable interface between two parties who never coordinate directly:

- **Vendors** write an SDK once, coding against a finite set of **purpose-named semantic
  tokens** (e.g. `color.action.primary`, `typography.body`, `space.md`). They never reference
  a host's raw colors or component names. A vendor may build a **new** SDK directly against the
  contract, **or retrofit an existing/already-shipped SDK** by feeding it the contract's
  resolved token values — both are first-class adoption modes (see User Story 6 / FR-018).
- **Financial institutions (FIs)** express their design system as a **DTCG token file** —
  primitives, semantic aliases, optional component overrides, and theme modes — that conforms
  to this contract's schema.

Because both sides target the same contract, re-skinning the SDK for a new FI is a *data change
only* (Constitution Principle IV). This spec defines the data shape and the rules; it does not
implement the resolver, loaders, or any adapter (those are Specs B and C).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Vendor codes once against the semantic vocabulary (Priority: P1)

A vendor building the onboarding SDK styles every component by referencing semantic tokens
only. They never see, name, or depend on any specific bank's palette or primitives. When the
host theme changes, their code does not.

**Why this priority**: This is the core thesis. If the semantic vocabulary cannot express a
real banking UI without reaching for host primitives, the framework fails.

**Independent Test**: Build the onboarding screens' style layer referencing only documented
semantic token IDs; a lint/typecheck over the SDK source finds zero references to primitive or
host-specific token paths.

**Acceptance Scenarios**:

1. **Given** the published semantic vocabulary, **When** a vendor styles a primary button, an
   input, body text, a step indicator, and an error message, **Then** every styled property
   maps to a documented semantic token and no primitive token is referenced.
2. **Given** SDK source coded against the contract, **When** the active theme is swapped,
   **Then** no SDK source change is required for it to restyle.

---

### User Story 2 — FI authors a conformant DTCG theme file (Priority: P1)

An FI theme author writes a DTCG JSON file describing their design system: primitive scales,
semantic aliases that point at those primitives, and at least a `light` mode. A validator
confirms the file satisfies the contract: DTCG-valid, every required semantic token present,
every alias resolvable.

**Why this priority**: A theme that does not provide the full semantic vocabulary leaves SDK
components unstyled. Validation is what makes "one SDK, N banks" safe rather than hopeful.

**Independent Test**: Run the validator against a hand-authored theme file; it passes for a
complete file and fails with precise, located errors for a file missing a required semantic
token or containing an unresolvable alias.

**Acceptance Scenarios**:

1. **Given** a DTCG file defining all required semantic tokens via aliases to primitives,
   **When** it is validated, **Then** validation passes.
2. **Given** a file missing a required semantic token, **When** it is validated, **Then**
   validation fails and names the missing token ID.
3. **Given** a semantic alias pointing at a non-existent primitive, **When** it is validated,
   **Then** validation fails and names the broken reference.
4. **Given** a token whose `$type` is incompatible with its semantic role (e.g. a `dimension`
   where a `color` is required), **When** it is validated, **Then** validation fails with a
   type-mismatch error.

---

### User Story 3 — FI nudges specific components without forking semantics (Priority: P2)

An FI wants its primary buttons fully rounded and its inputs to have a heavier border, while
everything else follows the semantic layer. The author adds a small number of **component
tokens** that override only those roles; unspecified component properties fall back to their
semantic defaults.

**Why this priority**: Real design systems have component-specific intent. Without this, FIs
would fork the semantic layer to express it. It is P2 because the framework is usable without
it — component tokens are optional.

**Independent Test**: Author a theme with a handful of component-token overrides; confirm the
contract marks them optional, that each declares the semantic token it defaults to, and that a
theme omitting them entirely still validates.

**Acceptance Scenarios**:

1. **Given** a theme with `button.primary.radius` set, **When** validated, **Then** it passes
   and the override is recognized as a component token for the `button.primary` role.
2. **Given** a theme with no component tokens at all, **When** validated, **Then** it passes
   (component layer is optional).
3. **Given** a component token referencing an undefined component role, **When** validated,
   **Then** validation fails and names the unknown role.

---

### User Story 4 — One theme file carries light, dark, and high-contrast modes (Priority: P2)

An FI provides `light`, `dark`, and `highContrast` variants in a single theme file. The same
semantic token resolves to different values per mode. A theme may provide only `light`; other
modes are optional but, when present, must define the same required semantic set.

**Why this priority**: Mode support is expected of modern banking apps and is cheap to encode
as a convention. P2 because a single-mode (`light`) theme is a valid MVP.

**Independent Test**: Author a theme with `light` + `dark`; resolve each mode and confirm a
mode-sensitive token (e.g. `color.surface.base`) yields the correct per-mode value, and that a
`dark` block missing a required token fails validation.

**Acceptance Scenarios**:

1. **Given** a theme with `light` and `dark` modes, **When** the `dark` mode is selected,
   **Then** every required semantic token resolves to its `dark` value.
2. **Given** a theme providing only `light`, **When** validated, **Then** it passes and `light`
   is treated as the default mode.
3. **Given** a `highContrast` mode that omits a required semantic token defined in `light`,
   **When** validated, **Then** validation fails and names the missing token for that mode.

---

### User Story 5 — The vocabulary evolves without breaking existing SDKs (Priority: P3)

The maintainers add a new semantic token in a later minor version. SDKs and themes built
against the prior version continue to validate and render. A removal or rename is rejected
except under an explicit major version with a migration note.

**Why this priority**: The contract's long-term value depends on stability. P3 for v1 because
the rules matter most once there is an external ecosystem, but they must be defined now so v0
is shaped correctly.

**Independent Test**: Take a theme valid under contract vMAJOR.MINOR; validate it against
vMAJOR.(MINOR+1) (additive) and confirm it still passes; confirm tooling flags a proposed
rename/removal as a major-version breaking change.

**Acceptance Scenarios**:

1. **Given** a theme valid under contract v1.0, **When** validated under an additive v1.1,
   **Then** it still passes.
2. **Given** a proposed change that removes or renames a semantic token, **When** the contract
   version is computed, **Then** it is classified as MAJOR (breaking).

---

### User Story 6 — Existing vendor SDK adopts the contract without a rewrite (Priority: P2)

A vendor already ships an SDK with its own styling. Rather than rebuilding it, they wrap it so
it consumes the contract's **resolved token values** — replacing hard-coded styles (or
populating their existing theme layer) with semantic tokens incrementally, screen by screen.
The SDK works *in conjunction with* Polymorph rather than being rewritten on top of it.

**Why this priority**: Most real-world adoption is brownfield. If Polymorph only serves
greenfield SDKs it cannot meet the goal of working "inside or in conjunction with any SDK, new
or already provided." P2 because the greenfield path (US1) proves the thesis first, but
retrofit must be a *designed* path, not an afterthought.

**Independent Test**: Take a small existing themed component that hard-codes colors/spacing;
without changing its structure, back its style values with the resolved semantic token map and
confirm it re-skins across both mock banks with no further changes.

**Acceptance Scenarios**:

1. **Given** an existing component that resolves style values at runtime, **When** it is
   supplied the resolved semantic token map, **Then** it renders themed without any change to
   its component structure.
2. **Given** a vendor SDK with its own theme object/styling API, **When** that theme object is
   populated from resolved contract values via an adapter shim, **Then** the SDK restyles per
   host with no change to the SDK's component code.
3. **Given** a retrofit integration, **When** the SDK is audited, **Then** all themed values
   trace to semantic tokens — retrofit does not reach around the contract to host primitives
   (Constitution Principle I still holds).

---

### Edge Cases

- **Alias cycles**: a semantic token that (transitively) references itself MUST be rejected
  with the cycle path reported.
- **Dangling reference**: an alias to a token ID that does not exist MUST fail validation.
- **Extra/unknown tokens**: a theme MAY include additional primitive or namespaced tokens
  beyond the contract; unknown *semantic* IDs in the reserved namespace are flagged (warning)
  to catch typos, but do not fail validation unless they collide with a reserved prefix.
- **Mode partial coverage**: a non-default mode that defines *some* but not *all* required
  semantic tokens MUST fail (no silent fallback across modes for required tokens).
- **Type coercion**: the contract does not coerce types; a value whose DTCG `$type` is
  incompatible with the semantic role's expected type fails validation.
- **Composite tokens** (e.g. typography): a partially-specified composite (missing a required
  sub-property such as `fontSize`) MUST fail validation for that token.
- **Out of scope for v1**: protected/legal-content safe regions are not modeled; disclosures
  are styled as ordinary themed text. The contract neither enforces nor guarantees legibility
  of legal content (flagged for a fast-follow).

---

## Requirements *(mandatory)*

### Functional Requirements — token layers & format

- **FR-001**: The contract MUST define tokens in **W3C DTCG** format (`$type`, `$value`,
  `$description`, and DTCG alias syntax). Polymorph adds only documented conventions on top;
  where a convention conflicts with DTCG, DTCG governs (Constitution Principle II).
- **FR-002**: The contract MUST define **four layers**: (1) **primitive** tokens (raw,
  FI-specific values), (2) **semantic/alias** tokens (the contract surface; purpose-named;
  defined as DTCG aliases to primitives), (3) **component** tokens (optional per-role
  overrides), (4) **theme modes** (`light` / `dark` / `highContrast` variants in one file).
- **FR-003**: The SDK-facing surface MUST be the **semantic layer only**. The contract MUST
  document that SDK code references semantic (and optionally component) tokens, never
  primitives.

### Functional Requirements — the semantic vocabulary

- **FR-004**: The contract MUST publish a **finite, purpose-named semantic vocabulary** (the v0
  set is enumerated in Appendix A) covering, at minimum: surface/background colors, text
  colors, interactive/action colors with states, feedback colors (success/warning/error/info),
  borders, focus, typography roles, a spacing scale, radii, border widths, elevation, opacity,
  motion (duration + easing), and control/target sizing.
- **FR-005**: Each semantic token MUST declare its **expected DTCG `$type`** (e.g.
  `color.text.body` → `color`; `space.md` → `dimension`; `typography.body` → `typography`
  composite) so themes can be type-checked against the role.
- **FR-006**: The contract MUST mark each semantic token as **required** or **optional**. A
  conformant theme MUST provide every required token (in its default mode, and in every mode it
  declares).
- **FR-007**: The semantic vocabulary MUST be expressive enough to style the v1 onboarding
  feature (multi-step wizard: surfaces, headings/body/caption text, primary/secondary/danger
  actions, text inputs with focus/error/disabled states, validation messaging, a step
  indicator, and disclosure text) **without reference to primitive tokens**. (This is verified
  empirically against Spec D; see Constitution Principle III.)

### Functional Requirements — SDK adoption modes & interop

- **FR-018**: The contract MUST support two adoption modes without privileging either:
  (a) **contract-native** — a new SDK codes directly against semantic tokens; (b) **retrofit** —
  an existing/already-shipped SDK consumes the contract's resolved values to back its current
  styling. Both MUST route through the **semantic layer** (Constitution Principle I); retrofit
  does not permit reaching around the contract to host primitives.
- **FR-019**: The contract's consumable output (`ResolvedTheme`, FR-014) MUST be a **plain,
  framework- and component-model-neutral** data structure (semantic ID → concrete value) so an
  existing SDK can read token values **without** adopting any particular component framework,
  styling library, or the SDK-owned component set.
- **FR-020**: The contract MUST be expressible as a **flat, namespaced key set** suitable for
  feeding common theme-interop targets (a JS theme object, CSS custom properties, or a platform
  theme structure), so a retrofit **shim** can map resolved tokens onto an existing SDK's theme
  API. The concrete per-platform interop surface (context, exported token objects, CSS vars) is
  realized in the adapter (Spec C); this spec only requires the output be neutral enough to
  enable it.

### Functional Requirements — component tokens

- **FR-008**: Component tokens MUST be **optional**. A theme that defines none MUST validate.
- **FR-009**: Each component token MUST be addressable by a **role-based ID**
  (`<component>.<variant>.<property>`, e.g. `button.primary.radius`, `input.border.color`) and
  MUST document the **semantic token it defaults to** when omitted.
- **FR-010**: The contract MUST define the **closed set of component roles** recognized in v0
  (Appendix B). A component token addressing an unknown role MUST fail validation.

### Functional Requirements — theme modes

- **FR-011**: A theme MUST declare at least a **`light`** mode, which is the default when no
  mode is selected.
- **FR-012**: `dark` and `highContrast` modes MUST be optional; when present, each MUST define
  the full required semantic set (FR-006). The contract MUST define how a value is expressed
  per mode (mode-keyed values vs. per-mode token sets — to be fixed in `/speckit-plan`; see
  Open Questions).

### Functional Requirements — validation & resolution semantics

- **FR-013**: The contract MUST ship a **machine-readable JSON Schema** (plus any auxiliary
  rule checks beyond JSON Schema's expressiveness) sufficient to validate a theme file for:
  DTCG well-formedness, presence of all required semantic tokens, type compatibility per role,
  resolvable aliases, recognized component roles, and per-mode completeness.
- **FR-014**: The contract MUST define **alias resolution semantics**: aliases resolve
  transitively to a concrete value; cycles are errors (Edge Cases); the *resolved* form of a
  theme is a flat map of semantic token ID → concrete value for a selected mode.
- **FR-015**: Validation errors MUST be **precise and located** — each error names the
  offending token ID / JSON path and the rule violated. (The implementation lives in
  `@polymorph/core`/`@polymorph/cli`, Spec B; this spec defines the required error semantics.)

### Functional Requirements — versioning

- **FR-016**: The contract MUST carry an explicit **semantic version**. **Adding** an optional
  token or component role is MINOR; **adding a required token** is MAJOR (it can invalidate
  existing themes); **renaming or removing** any semantic token or role is MAJOR.
- **FR-017**: The contract MUST document a **stability policy**: additions are the preferred
  evolution path; breaking changes require a major bump and a migration note (Constitution
  Principle III).

### Key Entities

- **PrimitiveToken**: a raw, FI-specific value (color, dimension, duration, fontFamily, etc.).
  Not part of the SDK-facing contract; referenced only by semantic tokens.
- **SemanticToken**: a purpose-named contract token with an ID, expected `$type`,
  required/optional flag, and (in a theme) a DTCG alias to a primitive. The SDK's only color
  surface.
- **ComponentToken**: an optional role-based override (`<component>.<variant>.<property>`) that
  declares the semantic token it defaults to.
- **ThemeMode**: one of `light` | `dark` | `highContrast`; `light` is the default.
- **ThemeFile**: a DTCG document containing primitives, semantic aliases, optional component
  tokens, across one or more modes; the unit an FI authors and ships.
- **ResolvedTheme**: the flat semantic-ID → concrete-value map produced for a selected mode
  (produced by Spec B's resolver; its *shape* is defined here).
- **ContractVersion**: the semantic version of the vocabulary + conventions a theme/SDK targets.

---

## Success Criteria *(mandatory)*

- **SC-001**: A vendor can express 100% of the v1 onboarding feature's visual styling using
  only semantic (and optionally component) tokens — **zero** primitive references in SDK source
  (verified by lint over Spec D's reference SDK).
- **SC-002**: Two visually distinct, complete themes (the Aurora and Borealis mock banks) both
  validate against the contract with no schema changes.
- **SC-003**: For every category of malformed theme in the Edge Cases list, validation fails
  with an error that names the specific token ID / path — no silent passes.
- **SC-004**: A theme valid under contract vX.Y still validates under any additive vX.(Y+1)
  (no regressions for additive changes).
- **SC-005**: The required semantic vocabulary is small enough that the count of **required**
  tokens an FI must supply for a single-mode theme is documented and bounded (target: a theme
  author can complete a minimal valid `light` theme by filling a single documented checklist).
- **SC-006**: An **existing** themed component (one that did not originally know about
  Polymorph) can be re-skinned across both mock banks **solely** by feeding it the resolved
  token map — with no change to its component structure — demonstrating the retrofit mode
  (verified against a brownfield fixture in the conformance suite, Spec E).

---

## Assumptions

- Hand-authored DTCG JSON is the only authoring path in scope for v1 (Figma/Tokens Studio
  import, auto-extract, and the interactive builder are post-v1).
- The semantic vocabulary in Appendix A is **v0** and will be refined empirically against the
  onboarding demo (Spec D) before being frozen as v1.0 of the contract.
- Per-platform value variations (e.g. a different elevation model on iOS vs Android) are **not**
  modeled in v0; the contract is platform-neutral and adapters interpret resolved values
  idiomatically.
- `highContrast` is treated as a distinct mode, not derived automatically; FIs author it
  explicitly when desired.
- The contract defines data and rules only. The resolver, linter, loaders, and CLI that act on
  it are specified in Spec B; the React Native interpretation is Spec C.
- Polymorph targets **both** new SDKs (built against the contract) and existing/already-shipped
  vendor SDKs (retrofitted to consume resolved tokens). The retrofit interop surface is defined
  per platform in Spec C plus a docs adoption guide; this spec only requires the contract's
  output be neutral enough to enable it (FR-019/FR-020).

---

## Open Questions (for `/speckit-clarify` → `/speckit-plan`)

1. **Mode encoding**: represent modes as DTCG `$extensions` mode-keyed values on a single token
   set, vs. parallel per-mode token sets, vs. DTCG Theme/`$modes` if the module has stabilized.
   Needs a check of current W3C DTCG module status during `/speckit-plan`.
2. **Composite typography**: adopt the DTCG `typography` composite type wholesale, or define a
   constrained subset (family/weight/size/lineHeight/letterSpacing) to keep adapters simple?
3. **Reserved namespace**: confirm the reserved prefix for semantic/component IDs (e.g. a
   `polymorph`/`pm` namespace vs. bare `color.*`) so FI primitives can never collide with
   contract IDs.
4. **State modeling**: encode interactive states (hover/pressed/disabled/focus) as token
   sub-IDs (`color.action.primary.pressed`) vs. a separate states convention — Appendix A
   currently assumes sub-IDs.
5. **Retrofit interop surface**: is the existing-SDK adoption surface (exported token objects,
   CSS custom properties, framework theme shims, a "theme → existing theme object" mapper) big
   enough to warrant its **own spec**, or does it fold into Spec C (adapter) plus a docs
   adoption guide? Decide before Spec C planning.

---

## Appendix A — Semantic Vocabulary v0 (proposed)

Purpose-named tokens the SDK codes against. `R` = required for a conformant theme, `O` =
optional. Types are DTCG `$type`.

### Color — surfaces & text

| Token ID | Type | Req | Purpose |
|---|---|---|---|
| `color.surface.base` | color | R | Default app/page background |
| `color.surface.raised` | color | R | Cards, sheets above base |
| `color.surface.sunken` | color | O | Wells, insets below base |
| `color.surface.overlay` | color | O | Modal/scrim surface |
| `color.surface.inverse` | color | O | High-emphasis inverse surface |
| `color.text.body` | color | R | Default body text |
| `color.text.muted` | color | R | Secondary text |
| `color.text.subtle` | color | O | Tertiary/placeholder-adjacent text |
| `color.text.onAction` | color | R | Text/icon on a primary action fill |
| `color.text.onInverse` | color | O | Text on `surface.inverse` |
| `color.text.link` | color | R | Hyperlink/affordance text |
| `color.text.disabled` | color | R | Disabled text |

### Color — actions (interactive, with states)

| Token ID | Type | Req | Purpose |
|---|---|---|---|
| `color.action.primary.rest` | color | R | Primary action fill |
| `color.action.primary.hover` | color | O | Primary hover (web) |
| `color.action.primary.pressed` | color | R | Primary pressed/active |
| `color.action.primary.disabled` | color | R | Primary disabled fill |
| `color.action.secondary.rest` | color | R | Secondary action fill/outline |
| `color.action.secondary.pressed` | color | O | Secondary pressed |
| `color.action.danger.rest` | color | R | Destructive action fill |
| `color.action.danger.pressed` | color | O | Destructive pressed |

### Color — feedback & borders

| Token ID | Type | Req | Purpose |
|---|---|---|---|
| `color.feedback.success` | color | R | Success accent/text |
| `color.feedback.warning` | color | R | Warning accent/text |
| `color.feedback.error` | color | R | Error accent/text (validation) |
| `color.feedback.info` | color | O | Informational accent/text |
| `color.border.default` | color | R | Default control/divider border |
| `color.border.subtle` | color | O | Low-emphasis divider |
| `color.border.strong` | color | O | High-emphasis border |
| `color.border.focus` | color | R | Focus-ring/active-field border |

### Typography (DTCG `typography` composite: family, weight, size, lineHeight, letterSpacing)

| Token ID | Type | Req | Purpose |
|---|---|---|---|
| `typography.display` | typography | O | Largest hero text |
| `typography.heading` | typography | R | Section/screen heading |
| `typography.headingSm` | typography | O | Sub-heading |
| `typography.body` | typography | R | Body copy / field text |
| `typography.bodyStrong` | typography | O | Emphasized body |
| `typography.label` | typography | R | Form labels / buttons |
| `typography.caption` | typography | R | Helper/validation/disclosure text |
| `typography.mono` | typography | O | Codes, account numbers |

### Space (scale; `dimension`)

| Token ID | Req | Purpose |
|---|---|---|
| `space.none` | R | 0 |
| `space.xs` | R | Tightest gap |
| `space.sm` | R | Small gap |
| `space.md` | R | Default inset/gap |
| `space.lg` | R | Section spacing |
| `space.xl` | R | Large spacing |
| `space.2xl` | O | Extra-large spacing |
| `space.3xl` | O | Hero spacing |

### Radius, border width, elevation, opacity (`dimension` / `number` / `shadow`)

| Token ID | Type | Req | Purpose |
|---|---|---|---|
| `radius.none` | dimension | R | Square corners |
| `radius.control` | dimension | R | Inputs, buttons |
| `radius.card` | dimension | R | Cards/sheets |
| `radius.pill` | dimension | O | Pills/badges |
| `radius.full` | dimension | O | Circular |
| `border.width.hairline` | dimension | R | 1px-equivalent divider |
| `border.width.thin` | dimension | R | Default control border |
| `border.width.thick` | dimension | O | Emphasis border |
| `elevation.flat` | shadow | R | No shadow |
| `elevation.raised` | shadow | R | Cards |
| `elevation.overlay` | shadow | O | Modals/popovers |
| `opacity.disabled` | number | R | Disabled element opacity |
| `opacity.muted` | number | O | De-emphasis |
| `opacity.scrim` | number | O | Backdrop scrim |

### Motion & sizing

| Token ID | Type | Req | Purpose |
|---|---|---|---|
| `motion.duration.short` | duration | R | Micro-interactions |
| `motion.duration.base` | duration | R | Standard transitions |
| `motion.duration.long` | duration | O | Larger transitions |
| `motion.easing.standard` | cubicBezier | R | Default easing |
| `motion.easing.emphasized` | cubicBezier | O | Expressive easing |
| `size.control.sm` | dimension | O | Compact control height |
| `size.control.md` | dimension | R | Default control height |
| `size.control.lg` | dimension | O | Large control height |
| `size.touchTarget.min` | dimension | R | Min touch target (a11y advisory) |
| `size.icon.md` | dimension | R | Default icon size |

> Counts (proposed v0): the **required** set is the conformance checklist an FI must fill for a
> minimal `light` theme. Optional tokens enrich fidelity. Final required/optional split is
> confirmed during clarify/plan against the onboarding demo (SC-005, Principle III).

---

## Appendix B — Component Roles v0 (proposed, closed set)

Optional component-token overrides; each property defaults to the listed semantic token.

| Role | Example properties → semantic default |
|---|---|
| `button.primary` | `background`→`color.action.primary.rest`, `foreground`→`color.text.onAction`, `radius`→`radius.control` |
| `button.secondary` | `background`/`border`→`color.action.secondary.rest`, `foreground`→`color.text.body` |
| `button.danger` | `background`→`color.action.danger.rest`, `foreground`→`color.text.onAction` |
| `input` | `background`→`color.surface.raised`, `border`→`color.border.default`, `borderFocus`→`color.border.focus`, `foreground`→`color.text.body`, `radius`→`radius.control` |
| `card` | `background`→`color.surface.raised`, `radius`→`radius.card`, `elevation`→`elevation.raised` |
| `stepIndicator` | `activeColor`→`color.action.primary.rest`, `inactiveColor`→`color.border.default` |
| `disclosure` | `foreground`→`color.text.muted`, `typography`→`typography.caption` |

> The v0 component-role set is deliberately scoped to the onboarding feature's needs. New roles
> are additive (MINOR) under the versioning rules (FR-016).
