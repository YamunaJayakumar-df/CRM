// Vitest configuration (our test runner) for the backend.
// "node" environment: tests run in plain Node.js, like the server itself.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
