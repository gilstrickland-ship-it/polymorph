// Golden-screenshot conformance. Capturing/diffing a rendered UI requires a platform renderer
// (React Native on device/Expo, a browser for web, etc.), which is NOT available in a headless
// CI container. Adapters supply a GoldenHarness; the v1 RN slice captures baselines on-device.

export interface GoldenHarness {
  /** Render a named scenario and return its image bytes. */
  capture(name: string, tree: unknown): Promise<Uint8Array>;
  /**
   * Compare actual bytes against the stored baseline for `name`. When the diff exceeds the
   * harness's threshold, implementations MAY return a `diffPng` (a visualization of the diff)
   * so reviewers/CI can see what changed.
   */
  compare(
    name: string,
    actual: Uint8Array,
  ): Promise<{ match: boolean; diffRatio: number; diffPng?: Uint8Array }>;
}

export class GoldenHarnessUnavailableError extends Error {
  constructor() {
    super("golden screenshots require a platform renderer (deferred — run on device/Expo/browser)");
    this.name = "GoldenHarnessUnavailableError";
  }
}

/** Placeholder used in headless environments; throws to make the deferral explicit. */
export const headlessGoldenHarness: GoldenHarness = {
  async capture() {
    throw new GoldenHarnessUnavailableError();
  },
  async compare() {
    throw new GoldenHarnessUnavailableError();
  },
};
