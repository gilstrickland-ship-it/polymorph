import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Satori rendering is several hundred ms per scenario; allow headroom.
    testTimeout: 15_000,
  },
});
