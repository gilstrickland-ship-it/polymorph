import { defineConfig } from "vitest/config";

export default defineConfig({
  // The example doesn't ship a `tsconfig.json` (only the typecheck config), so vitest's
  // internal esbuild doesn't see `jsx: "react-jsx"` from a project tsconfig and falls back
  // to the classic transform — which calls `React.createElement` and fails at runtime
  // because we don't import React explicitly. Pin the new transform here.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "happy-dom",
    globals: true, // @testing-library/react auto-cleanup between tests
  },
});
