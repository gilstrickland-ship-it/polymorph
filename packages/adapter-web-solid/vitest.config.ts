import { defineConfig } from "vitest/config";

export default defineConfig({
  // Solid ships separate server and client bundles via package exports; force its client
  // entries by adding the "browser" + "development" conditions, otherwise vite resolves the
  // SSR build whose `render`/`h` throw "client-only API" in Node.
  resolve: {
    conditions: ["browser", "development"],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "happy-dom",
    server: {
      deps: {
        // Forward the same conditions to Vitest's dep resolver.
        inline: ["solid-js"],
      },
    },
  },
});
