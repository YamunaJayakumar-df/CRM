// The ONE shared database client for the whole backend.
//
// Every route that needs the database imports `prisma` from here, so the app
// opens a single pool of connections instead of a new one per request.
// Tests replace this file with a fake (vi.mock), so they never touch the real database.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

/** Read DATABASE_URL (the pooled Supabase connection) or fail with a clear message. */
function readDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url.trim() === "") {
    throw new Error(
      "DATABASE_URL is not set. Add it to backend/.env (see backend/.env.example).",
    );
  }
  return url;
}

// Prisma 7 talks to Postgres through a "driver adapter" (here: the pg driver).
const adapter = new PrismaPg({ connectionString: readDatabaseUrl() });

export const prisma = new PrismaClient({ adapter });
