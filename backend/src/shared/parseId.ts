// Turns the ":id" part of a URL (always a string) into a database id number.
//
// Why: URLs like /customers/abc or /customers/-3 must be rejected with a clear
// 400 error BEFORE we ask the database, instead of crashing with a 500.
// Every feature (customers, interactions, follow-ups) reuses this helper.

// Our ids are Postgres "Int" columns, which cannot hold numbers above this.
// A bigger number could never be a real id, so we treat it as invalid.
const MAX_DATABASE_INT = 2_147_483_647;

/**
 * Parse a URL id like "12" into the number 12.
 * Accepts digits only ("12", "007"). Returns null for anything else:
 * "abc", "1.5", "-3", "0", "", " 7", "1e3", or numbers too big for the database.
 */
export function parseId(raw: string): number | null {
  const isDigitsOnly = /^[0-9]+$/.test(raw);
  if (!isDigitsOnly) {
    return null;
  }

  const id = Number(raw);
  if (id < 1 || id > MAX_DATABASE_INT) {
    return null;
  }
  return id;
}
