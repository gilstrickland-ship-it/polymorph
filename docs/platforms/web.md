# Web (CSS variables)

`@polymorph/adapter-web` is the framework-agnostic web core. It turns a `ResolvedTheme` into:

- A scoped `<style>` block declaring the resolved tokens as `--pm-*` CSS custom properties.
- A JS theme object that any framework binding can subscribe to.

Framework bindings are thin wrappers over the same core:

- React: built-in (re-exported from `@polymorph/adapter-web`)
- Vue 3: [`@polymorph/adapter-web-vue`](/platforms/web-vue)
- Solid 1.x: [`@polymorph/adapter-web-solid`](/platforms/web-solid)
- Angular 18+: [`@polymorph/adapter-web-angular`](/platforms/web-angular)

## What the core gives you

```ts
import { createThemeBridge } from "@polymorph/adapter-web";

const bridge = createThemeBridge();
bridge.setTheme(resolved);          // applies vars under a scoped class
bridge.subscribe((next) => { ... }); // observe theme changes
bridge.scopeClassName;              // e.g. "pm-theme-3a2c1"
```

`bridge.styleElement` is a real `<style>` block you can mount into any container. CSS author
code references the resulting variables:

```css
.button {
  background: var(--pm-color-action-primary-rest);
  color: var(--pm-color-text-on-action);
  border-radius: var(--pm-radius-control);
  padding: var(--pm-space-md);
}
```

## Naming convention

Polymorph token id → CSS custom property name:

| Token id | CSS variable |
|---|---|
| `pm.color.surface.base` | `--pm-color-surface-base` |
| `pm.space.md` | `--pm-space-md` |
| `pm.typography.body.fontSize` | `--pm-typography-body-fontSize` |

Composite tokens (`typography`, `shadow`) expand into one variable per sub-property.

## Framework bindings

Each binding wraps the same core with its preferred reactivity model. Pick one — they don't
compose.

See the per-framework pages for setup and primitives.
