// Date and time text for the UI, always as seen in India (Asia/Kolkata).
//
// Why: the company works in India, but the Next.js server may run in UTC.
// "Today", "Yesterday" and clock times must follow India's calendar, or a
// follow-up could show as due on the wrong day around midnight.
// Rules used throughout:
//   - Every function that needs "now" or "today" takes it as a parameter, so
//     tests can pass a fixed time and pages decide when "now" is.
//   - We read numbers (year, month, hour, ...) with Intl.DateTimeFormat and
//     build the text ourselves, instead of trusting a locale's layout, which
//     can differ between Node versions.
//   - Bad input (not a real date) throws an Error instead of showing "NaN".

const COMPANY_TIME_ZONE = "Asia/Kolkata";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// Exactly "YYYY-MM-DD".
const PLAIN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Reads the calendar parts of a moment as seen in India. Created once, reused.
// hourCycle "h23" gives hours 0-23 (never "24" for midnight).
const kolkataPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: COMPANY_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

/** A calendar day plus clock time, as numbers. month is 1-12. */
type KolkataParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/** A plain calendar day as numbers. month is 1-12. */
type CalendarDay = { year: number; month: number; day: number };

// ---------------------------------------------------------------------------
// Small private building blocks
// ---------------------------------------------------------------------------

/** Parse an ISO date-time string; throws if it is not a real moment. */
function parseIsoDateTime(iso: string): Date {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Not a valid date-time: "${iso}"`);
  }
  return date;
}

/** Throws if `now` is an invalid Date (e.g. new Date("oops")). */
function checkValidDate(now: Date): void {
  if (Number.isNaN(now.getTime())) {
    throw new Error("`now` is not a valid Date");
  }
}

/** The year, month, day, hour and minute of a moment, in Asia/Kolkata. */
function toKolkataParts(moment: Date): KolkataParts {
  const parts = kolkataPartsFormatter.formatToParts(moment);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    if (part === undefined) {
      throw new Error(`Could not read the ${type} of a date`);
    }
    return Number(part.value);
  };
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour") % 24,
    minute: read("minute"),
  };
}

/** Parse "YYYY-MM-DD"; throws if it is malformed or not a real day (e.g. Feb 31). */
function parsePlainDate(text: string): CalendarDay {
  if (!PLAIN_DATE_PATTERN.test(text)) {
    throw new Error(`Not a "YYYY-MM-DD" date: "${text}"`);
  }
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));

  // Date.UTC rolls "Feb 31" over into March; if the parts change, the day was not real.
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error(`Not a real calendar date: "${text}"`);
  }
  return { year, month, day };
}

/** Day number since 1970 for a calendar day, so two days can be subtracted. */
function dayNumber(day: CalendarDay): number {
  return Date.UTC(day.year, day.month - 1, day.day) / MS_PER_DAY;
}

/** "Oct 5, 2026" */
function formatCalendarDay(day: CalendarDay): string {
  return `${MONTH_NAMES[day.month - 1]} ${day.day}, ${day.year}`;
}

/** Pads a number to two digits: 5 -> "05". */
function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Today's date in Asia/Kolkata as "YYYY-MM-DD" (the `today` input of
 * formatDueDate / isOverdue). Example: 2026-10-26T20:00:00Z -> "2026-10-27".
 */
export function todayInKolkata(now: Date): string {
  checkValidDate(now);
  const { year, month, day } = toKolkataParts(now);
  return `${year}-${twoDigits(month)}-${twoDigits(day)}`;
}

/**
 * True when `text` is exactly "YYYY-MM-DD" AND a real calendar day.
 * Example: "2026-10-26" -> true; "2026-02-31" -> false; "26/10/2026" -> false.
 */
export function isPlainDate(text: string): boolean {
  try {
    parsePlainDate(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * A moment as the India calendar day and clock time, in the formats of
 * <input type="date"> ("YYYY-MM-DD") and <input type="time"> ("HH:mm", 24-hour).
 * Example: "2026-10-26T10:30:00.000Z" -> { date: "2026-10-26", time: "16:00" }
 * Throws an Error if `iso` is not a valid date-time.
 */
export function kolkataDateAndTime(iso: string): { date: string; time: string } {
  const { year, month, day, hour, minute } = toKolkataParts(parseIsoDateTime(iso));
  return {
    date: `${year}-${twoDigits(month)}-${twoDigits(day)}`,
    time: `${twoDigits(hour)}:${twoDigits(minute)}`,
  };
}

/**
 * Label for a follow-up's due day compared with today (both "YYYY-MM-DD").
 * Returns "Today", "Tomorrow", "Yesterday", or a date like "Oct 28, 2026".
 * Throws an Error if either value is not a real "YYYY-MM-DD" date.
 */
export function formatDueDate(dueDate: string, today: string): string {
  const due = parsePlainDate(dueDate);
  const daysFromToday = dayNumber(due) - dayNumber(parsePlainDate(today));

  if (daysFromToday === 0) return "Today";
  if (daysFromToday === 1) return "Tomorrow";
  if (daysFromToday === -1) return "Yesterday";
  return formatCalendarDay(due);
}

/**
 * True when the due day is before today (both "YYYY-MM-DD").
 * Only looks at dates: the caller should also check the follow-up is OPEN.
 * Throws an Error if either value is not a real "YYYY-MM-DD" date.
 */
export function isOverdue(dueDate: string, today: string): boolean {
  return dayNumber(parsePlainDate(dueDate)) < dayNumber(parsePlainDate(today));
}

/**
 * How long ago a moment was, e.g. for "last contacted".
 * - under 1 minute (or up to 1 minute in the future, clock drift) -> "Just now"
 * - under 1 hour -> "5 minutes ago" ("1 minute ago")
 * - earlier today (India) -> "2 hours ago" ("1 hour ago")
 * - yesterday (India) -> "Yesterday"
 * - anything else, including the future -> "Oct 20, 2026"
 * Throws an Error if `iso` or `now` is not a valid date.
 */
export function formatRelativeTime(iso: string, now: Date): string {
  checkValidDate(now);
  const moment = parseIsoDateTime(iso);
  const ageMs = now.getTime() - moment.getTime();

  if (Math.abs(ageMs) < MS_PER_MINUTE) {
    return "Just now";
  }
  if (ageMs < 0) {
    return formatShortDate(iso);
  }
  if (ageMs < MS_PER_HOUR) {
    const minutes = Math.floor(ageMs / MS_PER_MINUTE);
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  const daysAgo = dayNumber(toKolkataParts(now)) - dayNumber(toKolkataParts(moment));
  if (daysAgo === 0) {
    const hours = Math.floor(ageMs / MS_PER_HOUR);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (daysAgo === 1) {
    return "Yesterday";
  }
  return formatShortDate(iso);
}

/**
 * The India calendar day of a moment, e.g. "Oct 20, 2026".
 * Throws an Error if `iso` is not a valid date-time.
 */
export function formatShortDate(iso: string): string {
  return formatCalendarDay(toKolkataParts(parseIsoDateTime(iso)));
}

/**
 * The India clock time of a moment, e.g. "10:00 AM" or "12:05 PM".
 * Throws an Error if `iso` is not a valid date-time.
 */
export function formatTime(iso: string): string {
  const { hour, minute } = toKolkataParts(parseIsoDateTime(iso));
  const period = hour < 12 ? "AM" : "PM";
  // 0 -> 12 (midnight), 13 -> 1, 12 -> 12 (noon).
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${twoDigits(minute)} ${period}`;
}

/**
 * Today's date in India for a page header, e.g. "Wed, Oct 28, 2026".
 * Throws an Error if `now` is not a valid Date.
 */
export function formatLongToday(now: Date): string {
  checkValidDate(now);
  const day = toKolkataParts(now);
  const weekday = WEEKDAY_NAMES[new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay()];
  return `${weekday}, ${formatCalendarDay(day)}`;
}

/**
 * Greeting for the India time of day:
 * 05:00-11:59 "Good morning", 12:00-16:59 "Good afternoon", otherwise "Good evening".
 * Throws an Error if `now` is not a valid Date.
 */
export function greetingFor(now: Date): string {
  checkValidDate(now);
  const { hour } = toKolkataParts(now);
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}
