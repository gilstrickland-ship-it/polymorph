# @polymorph/example-mock-bank-borealis

Mock bank **B**. A distinct DTCG design-system token set (primitives → semantic → component →
modes) plus a host React Native shell that hosts the reference onboarding SDK and supplies its
theme via the Inline loader.

Deliberately divergent from `mock-bank-aurora` (color, type, radii, spacing, density) to make
the re-skin obvious. Also used to prove the loader abstraction: the same Borealis theme loaded
via Inline, RemoteManifest, and Bundled must render identically.

> Implemented in **Spec D — Reference demo + mock banks**.
