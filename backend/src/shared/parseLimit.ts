// Reads the optional ?limit= query value of a list endpoint
// (e.g. GET /interactions?limit=5 for "the 5 newest").
//
// Why: the dashboard only needs a few rows, so it should not download the
// whole list. The value comes from the URL, so it must be checked like any
// other client input: a whole number, at least 1, and never above the
// route's own safety limit. Interactions and follow-ups both reuse this.
import { parseId } from "./parseId.js";

/**
 * Read ?limit= for a list whose safety limit is `maxLimit` (e.g. 500).
 * Not sent -> { ok: true, limit: maxLimit } (the list behaves as before).
 * "1" to maxLimit -> { ok: true, limit }.
 * Anything else ("0", "-1", "2.5", "abc", "", "501", or a repeated
 * ?limit=1&limit=2, which Express gives as an array) -> { ok: false, error }.
 */
export function parseLimit(
  raw: unknown,
  maxLimit: number,
): { ok: true; limit: number } | { ok: false; error: string } {
  if (raw === undefined) {
    return { ok: true, limit: maxLimit };
  }

  const error = `limit must be a whole number from 1 to ${maxLimit}`;
  if (typeof raw !== "string") {
    return { ok: false, error };
  }

  // parseId already accepts exactly "digits only, 1 or more", which is
  // what a limit needs too; we only add the upper bound.
  const limit = parseId(raw);
  if (limit === null || limit > maxLimit) {
    return { ok: false, error };
  }
  return { ok: true, limit };
}
