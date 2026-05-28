import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "happy-dom",
    // @testing-library/react auto-registers an `afterEach(cleanup)` only when `globals: true`,
    // otherwise rendered nodes from earlier tests pile up in the JSDOM container and any
    // `screen.getByText("Save")` lookup matches every Save button ever rendered. Enable
    // globals here rather than calling `cleanup()` by hand in every test.
    globals: true,
  },
});
