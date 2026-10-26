// Loads backend/.env into process.env (built into Node, no "dotenv" needed).
//
// server.ts imports this file FIRST, so variables like DATABASE_URL are
// set before any other file (such as db.ts) reads them.
// If .env is missing (e.g. on a server that sets real env vars), we skip it.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on environment variables that are already set.
}
