// Checks that a "YYYY-MM-DD" date is a real day on the calendar.
//
// Why: JavaScript quietly "rolls over" impossible dates. new Date("2026-02-31")
// becomes 3 March instead of failing, so a typo would be saved as the wrong day.
// Interactions (occurredAt) and follow-ups (dueDate) both reuse this helper.

/**
 * True if year/month/day form a real calendar date, e.g. (2028, 2, 29) is true
 * (leap year) but (2026, 2, 31) and (2026, 13, 1) are false.
 * month is 1-12, as people write it.
 */
export function isRealCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  // Build the date in UTC; if JavaScript rolled it over, month or day changes.
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Same check for the first 10 characters of a string like "2026-10-26..." */
export function startsWithRealCalendarDate(text: string): boolean {
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  return isRealCalendarDate(year, month, day);
}
