// Settings for the Prisma command-line tool (npx prisma ...).
// The CLI reads this file when it creates migrations or checks the schema.
import { defineConfig } from "prisma/config";

// Load backend/.env into process.env (built into Node, no "dotenv" needed).
// Skipped if the file is missing, e.g. on a server that sets real env vars.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on environment variables that are already set.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations use the direct (session-mode) connection.
    // The running app will use DATABASE_URL (the pooled connection) instead.
    url: process.env["DIRECT_URL"],
  },
});
