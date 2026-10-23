// Vitest configuration (our test runner).
//
// - environment "node": tests run in plain Node.js, like our server code
//   (API routes). If we later test React components in a fake browser,
//   we can switch specific test files to a browser-like environment.
// - alias "@": lets tests import "@/app/..." exactly like the app does,
//   matching the "@/*" -> "./src/*" path in tsconfig.json.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
