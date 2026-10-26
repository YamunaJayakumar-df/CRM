// Tests for the plain-date helpers (a calendar day like "2026-10-30" with no time).
// These are plain functions, so we call them directly. They protect the rule
// that "today" is worked out in India (Asia/Kolkata), and that due dates never
// shift by a day when they travel to and from the database.
import { describe, it, expect } from "vitest";
import {
  dateToPlainDate,
  isPlainDate,
  plainDateToDate,
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
