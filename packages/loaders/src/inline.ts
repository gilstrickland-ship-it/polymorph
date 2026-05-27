import { makeLoadedTheme, type LoadedTheme, type ThemeLoader } from "./theme-loader.js";

/** Host passes a token object at SDK init — the simplest, primary loader. */
export class InlineLoader implements ThemeLoader {
  constructor(private readonly theme: unknown) {}
  async load(): Promise<LoadedTheme> {
    return makeLoadedTheme(this.theme);
  }
}
