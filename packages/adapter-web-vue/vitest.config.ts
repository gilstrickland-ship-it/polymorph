import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // ThemeProvider injects a <style> element + Vue Test Utils renders into a real DOM.
    environment: "happy-dom",
  },
});
