// Turns the date filters of GET /interactions (?range= or ?from=/?to=) into
// the time window Prisma uses for occurredAt: { gte?: Date; lt?: Date }.
//
// Why a separate file: the date maths (Kolkata calendar days, "inclusive"
// end days) is easy to get wrong by one day, so it lives in ONE small, pure
// function that tests can call directly with a fixed `today`.
// It only builds the window; checking the raw query text happens in
// interactionRoutes.ts, so the values passed here are already valid.
import { addDays, startOfDayInKolkata } from "../shared/plainDate.js";

// Quick ranges for ?range=. Each means "today and the N-1 days before it"
// (in Asia/Kolkata). To add one (e.g. "365d"), add it to both lists below.
export const DATE_RANGES = ["7d", "30d", "90d"] as const;

export type DateRange = (typeof DATE_RANGES)[number];

const DAYS_IN_RANGE: Record<DateRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/** Checked date filters. Use EITHER range OR from/to (either of those may be alone). */
export type DateFilters = {
  range?: DateRange;
  // Plain dates "YYYY-MM-DD" that passed isPlainDate; both days are included.
  from?: string;
  to?: string;
};

/** A Prisma condition for occurredAt. A missing side means "no limit on that side". */
export type OccurredAtWindow = { gte?: Date; lt?: Date };

/** True if `value` is exactly one of DATE_RANGES ("7d", "30d", "90d"). */
export function isDateRange(value: unknown): value is DateRange {
  const allowed: readonly unknown[] = DATE_RANGES;
  return allowed.includes(value);
}

/**
 * Build the occurredAt window for the checked date filters.
 * `today` is "YYYY-MM-DD" in Asia/Kolkata (passed in so tests can fix it).
 *
 * Examples with today = "2026-10-26" (Kolkata 00:00 = 18:30 UTC the day before):
 *   { range: "7d" }   -> gte 2026-10-19T18:30Z (start of 20 Oct), lt 2026-10-26T18:30Z (start of 27 Oct)
 *   { from: "2026-10-01", to: "2026-10-05" }
 *                     -> gte 2026-09-30T18:30Z (start of 1 Oct), lt 2026-10-05T18:30Z (start of 6 Oct)
 *   { from: "2026-10-01" } -> only gte;  { to: "2026-10-05" } -> only lt;  {} -> {}
 *
 * Throws if range is combined with from/to: the route must reject that first.
 */
export function buildOccurredAtWindow(
  filters: DateFilters,
  today: string,
): OccurredAtWindow {
  const { range, from, to } = filters;

  if (range !== undefined) {
    if (from !== undefined || to !== undefined) {
      // Programming error, not user input: fail loudly instead of guessing.
      throw new Error("buildOccurredAtWindow: use either range or from/to");
    }
    const firstDay = addDays(today, -(DAYS_IN_RANGE[range] - 1));
    return {
      gte: startOfDayInKolkata(firstDay),
      lt: startOfDayInKolkata(addDays(today, 1)),
    };
  }

  const window: OccurredAtWindow = {};
  if (from !== undefined) {
    window.gte = startOfDayInKolkata(from);
  }
  if (to !== undefined) {
    // "lt the start of the next day" keeps the whole `to` day, up to 23:59:59.999.
    window.lt = startOfDayInKolkata(addDays(to, 1));
  }
  return window;
}
