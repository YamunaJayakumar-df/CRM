// Vitest configuration (our test runner).
//
// - environment "node": tests run in plain Node.js, like our server code
//   (API routes). If we later test React components in a fake browser,
//   we can switch specific test files to a browser-like environment.
// - alias "@": lets tests import "@/app/..." exactly like the app does,
//   matching the "@/*" -> "./src/*" path in tsconfig.json.
// - passWithNoTests: the frontend has no tests yet; without this,
//   "npm test" fails just because there is nothing to run.
// - The ".mts" extension marks this file as an ES module (import/export),
//   since frontend/package.json does not set "type": "module".
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
