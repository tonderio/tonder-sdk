import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.js"],
    setupFiles: ["src/__tests__/setup.js"],
  },
});
