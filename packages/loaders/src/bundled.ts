import { makeLoadedTheme, type LoadedTheme, type ThemeLoader } from "./theme-loader.js";

/**
 * A build-time-compiled theme bundled into the app. Behaviorally identical resolution to
 * InlineLoader; a distinct type expresses delivery intent (bundled vs runtime-supplied).
 */
export class BundledLoader implements ThemeLoader {
  constructor(private readonly theme: unknown) {}
  async load(): Promise<LoadedTheme> {
    return makeLoadedTheme(this.theme);
  }
}
