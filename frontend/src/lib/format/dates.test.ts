// Tests for the India-time date helpers.
// Reminder: India (Asia/Kolkata) is UTC+5:30 all year (no daylight saving),
// so 04:30Z is 10:00 in India and 18:30Z is midnight in India.
import { describe, expect, it } from "vitest";
import {
  formatDueDate,
  formatLongToday,
  formatRelativeTime,
  formatShortDate,
  formatTime,
  greetingFor,
  isOverdue,
  isPlainDate,
  kolkataDateAndTime,
  todayInKolkata,
} from "./dates";

describe("todayInKolkata", () => {
  it("uses India's date, not UTC's", () => {
    // 20:00 UTC on the 26th is already 01:30 on the 27th in India.
    expect(todayInKolkata(new Date("2026-10-26T20:00:00Z"))).toBe("2026-10-27");
  });

  it("is still the same day one second before India's midnight", () => {
    expect(todayInKolkata(new Date("2026-10-26T18:29:59Z"))).toBe("2026-10-26");
  });

  it("pads month and day to two digits", () => {
    expect(todayInKolkata(new Date("2026-01-05T06:00:00Z"))).toBe("2026-01-05");
  });

  it("throws for an invalid Date", () => {
    expect(() => todayInKolkata(new Date("oops"))).toThrow("not a valid Date");
  });
});

describe("formatDueDate", () => {
  const today = "2026-10-26";

  it("says Today, Tomorrow and Yesterday for nearby days", () => {
    expect(formatDueDate("2026-10-26", today)).toBe("Today");
    expect(formatDueDate("2026-10-27", today)).toBe("Tomorrow");
    expect(formatDueDate("2026-10-25", today)).toBe("Yesterday");
  });

  it("shows a short date for days further away", () => {
    expect(formatDueDate("2026-10-28", today)).toBe("Oct 28, 2026");
    expect(formatDueDate("2026-10-05", today)).toBe("Oct 5, 2026");
  });

  it("handles month, year and leap-year edges", () => {
    expect(formatDueDate("2027-01-01", "2026-12-31")).toBe("Tomorrow");
    expect(formatDueDate("2026-02-28", "2026-03-01")).toBe("Yesterday");
    expect(formatDueDate("2028-02-29", "2028-02-28")).toBe("Tomorrow");
  });

  it("throws for malformed or impossible dates", () => {
    expect(() => formatDueDate("2026-02-31", today)).toThrow("Not a real calendar date");
    expect(() => formatDueDate("2026-10-5", today)).toThrow("YYYY-MM-DD");
    expect(() => formatDueDate("", today)).toThrow("YYYY-MM-DD");
    expect(() => formatDueDate("2026-10-26T00:00:00Z", today)).toThrow("YYYY-MM-DD");
    expect(() => formatDueDate("2026-10-26", "not a date")).toThrow("YYYY-MM-DD");
  });
});

describe("isOverdue", () => {
  it("is true only when the due day is before today", () => {
    expect(isOverdue("2026-10-25", "2026-10-26")).toBe(true);
    expect(isOverdue("2026-10-26", "2026-10-26")).toBe(false);
    expect(isOverdue("2026-10-27", "2026-10-26")).toBe(false);
  });

  it("works across a year change", () => {
    expect(isOverdue("2026-12-31", "2027-01-01")).toBe(true);
  });

  it("throws for a malformed date", () => {
    expect(() => isOverdue("26/10/2026", "2026-10-26")).toThrow("YYYY-MM-DD");
  });
});

describe("formatRelativeTime", () => {
  // 12:00 noon in India on Oct 26.
  const now = new Date("2026-10-26T06:30:00Z");

  it("says Just now for under a minute, also slightly in the future", () => {
    expect(formatRelativeTime("2026-10-26T06:29:30Z", now)).toBe("Just now");
    expect(formatRelativeTime("2026-10-26T06:30:00Z", now)).toBe("Just now");
    expect(formatRelativeTime("2026-10-26T06:30:30Z", now)).toBe("Just now");
  });

  it("counts minutes under an hour, with singular for 1", () => {
    expect(formatRelativeTime("2026-10-26T06:29:00Z", now)).toBe("1 minute ago");
    expect(formatRelativeTime("2026-10-26T06:25:00Z", now)).toBe("5 minutes ago");
    expect(formatRelativeTime("2026-10-26T05:31:00Z", now)).toBe("59 minutes ago");
  });

  it("counts hours earlier the same India day, with singular for 1", () => {
    expect(formatRelativeTime("2026-10-26T05:30:00Z", now)).toBe("1 hour ago");
    expect(formatRelativeTime("2026-10-26T04:30:00Z", now)).toBe("2 hours ago");
    // Exactly India midnight is still "today".
    expect(formatRelativeTime("2026-10-25T18:30:00Z", now)).toBe("12 hours ago");
  });

  it("says Yesterday for the previous India day", () => {
    // 23:59 on Oct 25 in India.
    expect(formatRelativeTime("2026-10-25T18:29:00Z", now)).toBe("Yesterday");
    // Midnight at the start of Oct 25 in India.
    expect(formatRelativeTime("2026-10-24T18:30:00Z", now)).toBe("Yesterday");
  });

  it("still counts minutes just across India's midnight", () => {
    const justAfterMidnight = new Date("2026-10-25T18:40:00Z"); // 00:10 India
    expect(formatRelativeTime("2026-10-25T18:20:00Z", justAfterMidnight)).toBe(
      "20 minutes ago",
    );
  });

  it("shows a date for older moments and for the future", () => {
    expect(formatRelativeTime("2026-10-24T06:30:00Z", now)).toBe("Oct 24, 2026");
    expect(formatRelativeTime("2026-10-26T08:30:00Z", now)).toBe("Oct 26, 2026");
  });

  it("throws for invalid input", () => {
    expect(() => formatRelativeTime("yesterday", now)).toThrow("Not a valid date-time");
    expect(() => formatRelativeTime("2026-10-26T06:00:00Z", new Date("x"))).toThrow(
      "not a valid Date",
    );
  });
});

describe("formatShortDate", () => {
  it("uses the India calendar day", () => {
    expect(formatShortDate("2026-10-20T04:30:00Z")).toBe("Oct 20, 2026");
    // 20:00 UTC on the 20th is the 21st in India.
    expect(formatShortDate("2026-10-20T20:00:00Z")).toBe("Oct 21, 2026");
  });

  it("throws for an invalid date-time", () => {
    expect(() => formatShortDate("")).toThrow("Not a valid date-time");
  });
});

describe("formatTime", () => {
  it("shows India clock time with AM/PM", () => {
    expect(formatTime("2026-10-26T04:30:00Z")).toBe("10:00 AM");
    expect(formatTime("2026-10-26T13:15:00Z")).toBe("6:45 PM");
  });

  it("shows midnight as 12 AM and noon as 12 PM", () => {
    expect(formatTime("2026-10-25T18:30:00Z")).toBe("12:00 AM");
    expect(formatTime("2026-10-26T06:35:00Z")).toBe("12:05 PM");
  });

  it("throws for an invalid date-time", () => {
    expect(() => formatTime("10:00")).toThrow("Not a valid date-time");
  });
});

describe("formatLongToday", () => {
  it("shows weekday and date in India", () => {
    expect(formatLongToday(new Date("2026-10-28T04:30:00Z"))).toBe("Wed, Oct 28, 2026");
  });

  it("uses India's day when UTC is still on the previous day", () => {
    expect(formatLongToday(new Date("2026-10-28T20:00:00Z"))).toBe("Thu, Oct 29, 2026");
  });

  it("throws for an invalid Date", () => {
    expect(() => formatLongToday(new Date(Number.NaN))).toThrow("not a valid Date");
  });
});

describe("greetingFor", () => {
  // Each time is given in UTC; the comment shows the India time.
  it.each([
    ["2026-10-25T23:29:00Z", "Good evening"], // 04:59
    ["2026-10-25T23:30:00Z", "Good morning"], // 05:00
    ["2026-10-26T06:29:00Z", "Good morning"], // 11:59
    ["2026-10-26T06:30:00Z", "Good afternoon"], // 12:00
    ["2026-10-26T11:29:00Z", "Good afternoon"], // 16:59
    ["2026-10-26T11:30:00Z", "Good evening"], // 17:00
    ["2026-10-25T18:30:00Z", "Good evening"], // 00:00
  ])("at %s says %s", (iso, expected) => {
    expect(greetingFor(new Date(iso))).toBe(expected);
  });

  it("throws for an invalid Date", () => {
    expect(() => greetingFor(new Date("x"))).toThrow("not a valid Date");
  });
});

describe("isPlainDate", () => {
  it("accepts real YYYY-MM-DD days", () => {
    expect(isPlainDate("2026-10-26")).toBe(true);
    expect(isPlainDate("2028-02-29")).toBe(true);
  });

  it("rejects other formats and days that do not exist", () => {
    expect(isPlainDate("2026-02-31")).toBe(false);
    expect(isPlainDate("26/10/2026")).toBe(false);
    expect(isPlainDate("2026-10-26T10:00")).toBe(false);
    expect(isPlainDate("")).toBe(false);
  });
});

describe("kolkataDateAndTime", () => {
  it("gives India's day and 24-hour time for the date and time inputs", () => {
    expect(kolkataDateAndTime("2026-10-26T10:30:00.000Z")).toEqual({
      date: "2026-10-26",
      time: "16:00",
    });
  });

  it("moves to the next day after India's midnight", () => {
    expect(kolkataDateAndTime("2026-10-26T18:35:00Z")).toEqual({
      date: "2026-10-27",
      time: "00:05",
    });
  });

  it("throws for text that is not a date-time", () => {
    expect(() => kolkataDateAndTime("soon")).toThrow();
  });
});
