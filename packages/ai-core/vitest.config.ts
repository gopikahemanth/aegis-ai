import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**", ".tmp_*/**"],
    fileParallelism: false,
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});


