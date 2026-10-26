// Builds the "?key=value&..." part of a backend URL.
//
// Why: search text typed by a user (e.g. "R&D Ltd") must be encoded, or the
// "&" would split it into two parameters. URLSearchParams does the encoding;
// we never glue user input into a URL by hand.

/** Allowed parameter values. undefined means "leave this parameter out". */
export type QueryValue = string | number | undefined;

/**
 * Build a query string from the given parameters, in the order given.
 * - undefined values and blank strings are left out
 * - strings are trimmed
 * - returns "" when nothing is left, otherwise text starting with "?"
 * Throws an Error for numbers that are NaN or Infinity (a bug in the caller).
 * Example: buildQueryString({ q: "R&D", limit: 5 }) -> "?q=R%26D&limit=5"
 */
export function buildQueryString(params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new Error(`Query parameter "${key}" must be a finite number`);
      }
      searchParams.append(key, String(value));
      continue;
    }

    const trimmed = value.trim();
    if (trimmed !== "") {
      searchParams.append(key, trimmed);
    }
  }

  const text = searchParams.toString();
  return text === "" ? "" : `?${text}`;
}
