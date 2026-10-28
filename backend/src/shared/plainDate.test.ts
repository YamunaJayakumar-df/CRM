// Tests for the plain-date helpers (a calendar day like "2026-10-30" with no time).
// These are plain functions, so we call them directly. They protect the rule
// that "today" is worked out in India (Asia/Kolkata), and that due dates never
// shift by a day when they travel to and from the database.
import { describe, it, expect } from "vitest";
import {
  addDays,
  dateToPlainDate,
  isPlainDate,
  plainDateOfMoment,
  plainDateToDate,
  startOfDayInKolkata,
  todayInKolkata,
} from "./plainDate.js";

describe("todayInKolkata", () => {
  // India is UTC+05:30, so a new day starts there at 18:30 UTC.

  // Protects the last second before midnight in India: still the same day.
  it("returns the same day one second before midnight in India", () => {
    expect(todayInKolkata(new Date("2026-10-26T18:29:59Z"))).toBe("2026-10-26");
  });

  // Protects the exact midnight boundary: India is already on the next day.
  it("returns the next day at midnight in India even though UTC is still on the old day", () => {
    expect(todayInKolkata(new Date("2026-10-26T18:30:00Z"))).toBe("2026-10-27");
  });

  // Protects the normal case: early in the UTC day it is the same day in India.
  it("returns the same day early in the UTC day", () => {
    expect(todayInKolkata(new Date("2026-10-26T01:00:00Z"))).toBe("2026-10-26");
  });

  // Protects that the result always has the "YYYY-MM-DD" shape.
  it("returns text shaped like YYYY-MM-DD when called without a time", () => {
    expect(todayInKolkata()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("plainDateToDate and dateToPlainDate", () => {
  // Protects the shape Prisma expects for a DATE column: midnight UTC.
  it("turns a plain date into a Date at midnight UTC", () => {
    expect(plainDateToDate("2026-10-30").toISOString()).toBe(
      "2026-10-30T00:00:00.000Z",
    );
  });

  // Protects that a Date from the database becomes the same plain date again.
  it("turns a midnight-UTC Date back into the plain date", () => {
    expect(dateToPlainDate(new Date("2026-10-30T00:00:00.000Z"))).toBe("2026-10-30");
  });

  // Protects that a round trip never shifts the day (including a leap day).
  it("gives back the same text after a round trip", () => {
    for (const text of ["2026-10-30", "2028-02-29", "2000-01-01", "2100-12-31"]) {
      expect(dateToPlainDate(plainDateToDate(text))).toBe(text);
    }
  });
});

describe("isPlainDate", () => {
  // Protects that real days in the allowed year range (2000-2100) are accepted.
  for (const value of ["2026-10-30", "2028-02-29", "2000-01-01", "2100-12-31"]) {
    it(`returns true for "${value}"`, () => {
      expect(isPlainDate(value)).toBe(true);
    });
  }

  // Protects against days that do not exist, typo years, times, spaces,
  // missing leading zeros, and values that are not text at all.
  const invalidValues: unknown[] = [
    "2026-02-31",
    "0226-10-30",
    "1999-12-31",
    "2101-01-01",
    "2026-10-30T00:00",
    " 2026-10-30",
    "2026-1-5",
    20261030,
    null,
    undefined,
  ];
  for (const value of invalidValues) {
    it(`returns false for ${JSON.stringify(value) ?? "undefined"}`, () => {
      expect(isPlainDate(value)).toBe(false);
    });
  }
});

describe("plainDateOfMoment", () => {
  // Protects that a timestamp late in the evening in India stays on that day.
  it("returns the same day for 17:30 UTC (23:00 in India)", () => {
    expect(plainDateOfMoment(new Date("2026-10-26T17:30:00Z"))).toBe("2026-10-26");
  });

  // Protects that a timestamp after midnight in India counts on the next day.
  it("returns the next day for 18:30 UTC (00:00 in India)", () => {
    expect(plainDateOfMoment(new Date("2026-10-26T18:30:00Z"))).toBe("2026-10-27");
  });
});

describe("addDays", () => {
  // Protects the simple case.
  it("adds days within a month", () => {
    expect(addDays("2026-10-26", 3)).toBe("2026-10-29");
  });

  // Protects crossing the end of a month.
  it("crosses the end of a month", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });

  // Protects crossing the end of a year.
  it("crosses the end of a year", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  // Protects leap years: going back from 1 March lands on 29 February.
  it("lands on the leap day when going back from 1 March in a leap year", () => {
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  // Protects non-leap years: no 29 February.
  it("skips 29 February in a non-leap year", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  // Protects negative values (going back), including across a year.
  it("goes back with a negative number", () => {
    expect(addDays("2026-01-05", -14)).toBe("2025-12-22");
  });

  // Protects that 0 gives the same day.
  it("returns the same day for 0", () => {
    expect(addDays("2026-10-26", 0)).toBe("2026-10-26");
  });
});

describe("startOfDayInKolkata", () => {
  // Protects that midnight in India is 18:30 UTC on the day before.
  it("returns 18:30 UTC on the previous day", () => {
    expect(startOfDayInKolkata("2026-10-26").toISOString()).toBe(
      "2026-10-25T18:30:00.000Z",
    );
  });

  // Protects that the start of a day in India is that same day in India.
  it("is the first moment of that day in India", () => {
    const start = startOfDayInKolkata("2026-10-26");

    expect(plainDateOfMoment(start)).toBe("2026-10-26");
    expect(plainDateOfMoment(new Date(start.getTime() - 1))).toBe("2026-10-25");
  });
});
