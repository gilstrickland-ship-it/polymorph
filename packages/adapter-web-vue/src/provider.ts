import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  provide,
  toRaw,
  type InjectionKey,
  type PropType,
} from "vue";
import type { ResolvedTheme } from "@polymorph/spec";
import { createBridge, toCssVariablesString } from "@polymorph/adapter-web";
import type { ComponentRegistry, SlotComponents, ThemeContextValue } from "./types.js";

/** Injection key used by `useTheme` / the other composables. */
export const ThemeKey: InjectionKey<ThemeContextValue> = Symbol("polymorph-theme");

/**
 * `<ThemeProvider :theme="…">`. Injects a scoped `<style>` block with the resolved theme's CSS
 * variables and provides context (theme / bridge / slots / components / scope) to descendants
 * via Vue's `inject`. Switching the `theme` prop updates the variables; consumers don't
 * re-render unless they read theme-dependent values directly.
 */
export const ThemeProvider = defineComponent({
  name: "ThemeProvider",
  props: {
    theme: { type: Object as PropType<ResolvedTheme>, required: true },
    slots: { type: Object as PropType<SlotComponents>, default: () => ({}) },
    components: { type: Object as PropType<ComponentRegistry>, default: () => ({}) },
    /** Override the auto-generated wrapper class. */
    scope: { type: String, default: "" },
  },
  setup(props, { slots: vSlots }) {
    const inst = getCurrentInstance();
    const scope = computed(
      () => props.scope || `pm-theme-${inst ? inst.uid : Math.random().toString(36).slice(2, 10)}`,
    );
    const bridge = computed(() => createBridge(props.theme));
    const css = computed(() => toCssVariablesString(props.theme, `.${scope.value}`));

    // Provide a getter-backed object so reads from descendants stay reactive on `props` changes.
    const ctx: ThemeContextValue = {
      get theme() {
        return props.theme;
      },
      get bridge() {
        return bridge.value;
      },
      // `toRaw` unwraps Vue's reactive proxy so consumers compare component references by
      // identity (and don't accidentally pass a proxy of a component to `h(…)`).
      get slots() {
        return toRaw(props.slots) as SlotComponents;
      },
      get components() {
        return toRaw(props.components) as ComponentRegistry;
      },
      get scope() {
        return scope.value;
      },
    };
    provide(ThemeKey, ctx);

    return () =>
      h("div", { class: scope.value }, [
        h("style", { "data-polymorph-theme": scope.value }, css.value),
        vSlots.default?.(),
      ]);
  },
});
