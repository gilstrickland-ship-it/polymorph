# Polymorph Constitution

Polymorph is an open framework and open contract that lets any SDK (web or mobile) adapt to a
host application's design system without changing the SDK per design system. These principles
are binding on every spec and implementation.

## Core Principles

### I. Contract-First (NON-NEGOTIABLE)

The SDK consumes a stable, semantic theme **contract** — never any financial institution's
primitive palette, raw values, or component names. This holds whether the SDK is **built new
against the contract** or an **existing/already-shipped SDK retrofitted** to consume the
contract's resolved values: both route all styling through the semantic layer. Any code path
that reaches around the contract to a host's primitives is a defect — including in a retrofit.
The contract (`@polymorph/spec`) must stabilize before any adapter is built.

### II. Standards-Based, Minimally Extended

Tokens are authored in **W3C DTCG** format. Polymorph adds only thin, documented *conventions*
on top (component-token layer, theme-mode variants) — never a competing token format. When the
DTCG spec and a Polymorph convention conflict, DTCG wins and the convention is revised.

### III. Stable, Versioned Semantic Vocabulary

The semantic/alias vocabulary is the crux of the project: purpose-named, finite, and expressive
enough for real banking UI, yet small and stable enough that a vendor targets it once.
**Additions are the only safe change.** Renames and removals are breaking and require an
explicit major version. The vocabulary is versioned independently and derived empirically from
real feature needs (starting with the onboarding demo).

### IV. Adaptation Is Data Plus a Thin Adapter

Re-skinning for a new design system must be a **token/data change only** — never a fork or
per-FI edit of SDK source. One SDK build renders across N design systems. The v1 acceptance bar
is literal: swapping the reference SDK between two mock banks touches zero SDK source. This
applies to **new and existing SDKs alike**: adopting Polymorph in an already-shipped SDK is an
**additive integration** — consume resolved tokens (via a thin shim into the SDK's existing
theme/style layer), not a rewrite — and re-skinning across FIs thereafter remains a data change
only. To make this possible, the contract's resolved output MUST stay framework- and
component-model-neutral so any SDK can consume it.

### V. Hybrid Rendering With Escape Hatches

Default rendering is SDK-owned components styled entirely from resolved tokens. Hosts may
override via named **render slots**; an optional, role-based **component-mapping** registry
exists as a power feature. Slots and mapping are escape hatches — not a general-purpose host
component framework — and must never become required for a baseline integration.

### VI. Accessibility Is Advisory but Loud

The a11y linter **warns, it does not block** — the host owns final compliance. Advisory status
is not an excuse for a weak linter: checks (contrast, target size, etc.) must be strong, clear,
and surfaced prominently in CLI and tooling output.

### VII. Conformance-Gated

Every platform adapter must pass the shared **conformance suite** (fixtures, assertions, golden
screenshots) before it is considered real. Conformance and advisory lint passing for all target
hosts is the definition of done for a vertical slice.

## Technology & Architecture Constraints

- **License:** Apache-2.0 across the entire repository.
- **Repo:** monorepo on **pnpm workspaces + Nx**.
- **First vertical slice:** **React Native**, end to end (contract + core + loaders + adapter +
  reference SDK + two mock banks + conformance). Web, Flutter, and native iOS/Android follow
  post-v1 against the same contract.
- **Token delivery:** pluggable behind one `ThemeLoader` interface — Inline, RemoteManifest,
  Bundled. The runtime resolver (TypeScript) serves web + RN; **Style Dictionary** is reused as
  the build-time transform engine for Flutter / native artifacts rather than re-built.
- **Token layers:** primitive → semantic/alias (the contract) → component (optional overrides)
  → theme modes (light / dark / highContrast).
- **Deferred for v1:** protected/legal-content safe regions; a11y *enforcement* + certification;
  remote-manifest signing/governance; authoring paths beyond hand-authored DTCG JSON.

## Development Workflow

- All work proceeds through **Spec Kit**: `/speckit-specify` → `/speckit-clarify` →
  `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`, one spec at a time.
- Specs are sequenced so the contract stabilizes first: **A** Contract → **B** Core + Loaders →
  **C** React Native adapter → **D** Reference demo + mock banks → **E** Conformance suite.
- A spec may not depend on an unstable upstream contract; if a downstream spec forces a contract
  change, that change goes through Spec A's versioning rules (Principle III), not a local patch.

## Governance

This constitution supersedes other practices. Every spec, plan, and implementation must be
checkable against these principles; deviations require explicit justification recorded in the
relevant spec. Amendments require updating this file with a new version and date. Versioning is
semantic: MAJOR for principle removals/redefinitions, MINOR for new principles or materially
expanded guidance, PATCH for clarifications.

**Version**: 1.1.0 | **Ratified**: 2026-05-27 | **Last Amended**: 2026-05-27

> **v1.1.0 (2026-05-27)** — Clarified Principles I and IV so the contract explicitly covers
> **new *and* existing/already-shipped SDKs** (contract-native and retrofit adoption), and
> required the resolved output to stay framework/component-model-neutral. Additive
> clarification; no principle removed or redefined (MINOR).
