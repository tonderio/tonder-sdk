import { defineConfig } from "vitest/config";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  define: { "process.env.SDK_VERSION": JSON.stringify(pkg.version) },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.js"],
    setupFiles: ["src/__tests__/setup.js"],
  },
});
