import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    env: { DATABASE_PATH: ":memory:" },
    unstubGlobals: true,
    testTimeout: 30_000,
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      // Route files under src/app only render a component; Playwright covers them.
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/app/layout.tsx", "src/app/**/page.tsx"],
    },
  },
});
