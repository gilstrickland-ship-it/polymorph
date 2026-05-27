# @polymorph/spec

The Polymorph theme **contract** — the open standard at the heart of the framework.

Defines, as DTCG-extended JSON:

- **Primitive tokens** — raw palette, type scale, spacing, radii, durations (FI-specific; the SDK never references these directly).
- **Semantic / alias tokens** — the contract. Purpose-named, stable, finite vocabulary the SDK codes against (e.g. `color.surface.base`, `color.action.primary`, `typography.body`, `space.inset.md`, `radius.control`).
- **Component tokens** — optional targeted per-role overrides that default to semantic tokens.
- **Theme modes** — `light` / `dark` / `highContrast` variants colocated in one theme file.

Also ships the JSON Schema used for validation and the explicit versioning rules for the
semantic vocabulary (additions are the only safe change).

> Implemented in **Spec A — The Contract**. This is the first and most important spec; the
> contract must stabilize before adapters are built.
