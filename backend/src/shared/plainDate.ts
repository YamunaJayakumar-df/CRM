// Helpers for "plain dates": a calendar day like "2026-10-30" with no time and
// no timezone (e.g. a follow-up's due date).
//
// Why: a due date means "that day in India", not a moment in time. Mixing it
// with JavaScript Date (which is always a moment) easily shifts it by one day.
// These helpers keep the conversions in ONE place:
//   - "today" is always worked out in Asia/Kolkata (the company's timezone),
//     never in the server's own timezone (servers often run in UTC).
//   - Postgres DATE values travel through Prisma as a Date at midnight UTC.
import { startsWithRealCalendarDate } from "./dateChecks.js";

// The company's timezone (owner decision). All "today" questions use it.
const COMPANY_TIME_ZONE = "Asia/Kolkata";

// Exactly "YYYY-MM-DD": four digits, dash, two digits, dash, two digits.
const PLAIN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Allowed years for a plain date. Catches typos like "0226-10-30";
// due dates outside this range are never real.
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

// Reads the year, month and day of a moment as seen in India. Created once and reused.
// We use formatToParts (below) instead of relying on a locale's date format,
// because locale formats can differ between Node versions.
const kolkataDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: COMPANY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// India's offset from UTC. India has used +05:30 all year (no daylight
// saving time) since 1945, so a fixed offset is safe here.
const KOLKATA_UTC_OFFSET = "+05:30";

/**
 * Today's date in Asia/Kolkata as "YYYY-MM-DD".
 * Example: at 2026-10-26T20:00:00Z it is already 27 October in India -> "2026-10-27".
 * `now` defaults to the current time; tests pass a fixed time instead.
 */
export function todayInKolkata(now: Date = new Date()): string {
  return plainDateOfMoment(now);
}

/**
 * The calendar day in Asia/Kolkata on which a moment (a timestamp such as
 * createdAt or occurredAt) happened, as "YYYY-MM-DD".
 * Example: 2026-10-26T17:30:00Z is 23:00 in India -> "2026-10-26";
 *          2026-10-26T18:30:00Z is 00:00 the next day in India -> "2026-10-27".
 */
export function plainDateOfMoment(moment: Date): string {
  const parts = kolkataDateFormatter.formatToParts(moment);
  const year = readDatePart(parts, "year");
  const month = readDatePart(parts, "month");
  const day = readDatePart(parts, "day");
  return `${year}-${month}-${day}`;
}

/** Pick one piece ("year", "month" or "day") out of formatToParts' result. */
function readDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: "year" | "month" | "day",
): string {
  const part = parts.find((p) => p.type === type);
  if (part === undefined) {
    // Should never happen; fail loudly instead of returning a wrong date.
    throw new Error(`Could not read the ${type} of a date in Asia/Kolkata`);
  }
  return part.value;
}

/**
 * The plain date `days` days after `plainDate` (negative goes back).
 * Handles month and year ends: addDays("2026-12-31", 1) -> "2027-01-01",
 * addDays("2028-03-01", -1) -> "2028-02-29" (leap year).
 * Only call this with text that passed isPlainDate.
 */
export function addDays(plainDate: string, days: number): string {
  // Working in UTC means there is no daylight saving jump to worry about.
  const date = plainDateToDate(plainDate);
  date.setUTCDate(date.getUTCDate() + days);
  return dateToPlainDate(date);
}

/**
 * The moment a plain date STARTS in India (00:00 in Asia/Kolkata).
 * Example: "2026-10-26" -> 2026-10-25T18:30:00.000Z.
 * Used to ask the database for timestamps (createdAt, occurredAt) that fall
 * on certain Indian calendar days. Only call this with text that passed isPlainDate.
 */
export function startOfDayInKolkata(plainDate: string): Date {
  return new Date(`${plainDate}T00:00:00${KOLKATA_UTC_OFFSET}`);
}

/**
 * Turn "2026-10-30" into the Date Prisma expects for a @db.Date column:
 * midnight UTC of that day. Only call this with text that passed isPlainDate.
 */
export function plainDateToDate(text: string): Date {
  return new Date(text + "T00:00:00.000Z");
}

/**
 * Turn a Date read from a @db.Date column (midnight UTC) back into "2026-10-30".
 * Uses UTC on purpose: reading it in local time could give the previous day.
 */
export function dateToPlainDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * True if `value` is a string like "2026-10-30" that is a real calendar day
 * (not "2026-02-31") with a year from 2000 to 2100.
 * Strings with a time ("2026-10-30T10:00") or extra spaces are rejected.
 */
export function isPlainDate(value: unknown): value is string {
  if (typeof value !== "string" || !PLAIN_DATE_PATTERN.test(value)) {
    return false;
  }
  if (!startsWithRealCalendarDate(value)) {
    return false;
  }
  const year = Number(value.slice(0, 4));
  return year >= MIN_YEAR && year <= MAX_YEAR;
}
