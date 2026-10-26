// Reads the optional ?q= search text of a list endpoint.
//
// Why one shared file: customers and follow-ups both offer ?q= search, and
// the rules (single value, trimmed, blank means "no search", length limit)
// must be the same everywhere. Turning the text into a Prisma "where" stays
// in each route, because every feature searches different fields.

// Longest search text we accept for ?q= (in characters, after trimming).
const MAX_SEARCH_LENGTH = 100;

/**
 * Read the optional ?q=acme search text.
 * Returns { ok: true, search } (undefined when not sent or blank), or
 * { ok: false, error } when it is invalid.
 * Express gives a string, or an array for odd URLs like ?q=a&q=b;
 * anything that is not a single string is invalid.
 */
export function readSearchText(
  raw: unknown,
): { ok: true; search: string | undefined } | { ok: false; error: string } {
  if (raw === undefined) {
    return { ok: true, search: undefined };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "q must be a single search text" };
  }

  const search = raw.trim();
  if (search === "") {
    return { ok: true, search: undefined };
  }
  if (search.length > MAX_SEARCH_LENGTH) {
    return {
      ok: false,
      error: `q must be at most ${MAX_SEARCH_LENGTH} characters`,
    };
  }
  return { ok: true, search };
}
