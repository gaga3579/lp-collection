import { defineConfig, type ViteUserConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // The plugins are typed against the root vite (v8) while vitest 2.x bundles
  // its own vite 5 types; they are runtime-compatible, so bridge the type gap.
  plugins: [tsconfigPaths(), react()] as unknown as ViteUserConfig["plugins"],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Source lives in app/, components/, lib/, supabase/.
    include: ["{app,components,lib,supabase}/**/*.{test,spec}.{ts,tsx}", "__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
});
