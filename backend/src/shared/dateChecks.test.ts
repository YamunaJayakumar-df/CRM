// Tests for the calendar-date checks. JavaScript quietly turns 31 February
// into 3 March, so without these checks a typo would be saved as the wrong day.
import { describe, it, expect } from "vitest";
import {
  isRealCalendarDate,
  startsWithRealCalendarDate,
} from "./dateChecks.js";

describe("isRealCalendarDate", () => {
  // Protects the normal case: an ordinary date is accepted.
  it("returns true for an ordinary date", () => {
    expect(isRealCalendarDate(2026, 10, 26)).toBe(true);
  });

  // Protects leap years: 29 February exists in 2028.
  it("returns true for 29 February in a leap year", () => {
    expect(isRealCalendarDate(2028, 2, 29)).toBe(true);
  });

  // Protects that 29 February is rejected in a normal year.
  it("returns false for 29 February in a non-leap year", () => {
    expect(isRealCalendarDate(2026, 2, 29)).toBe(false);
  });

  // Protects against days that do not exist in a month.
  it("returns false for 31 February and 31 April", () => {
    expect(isRealCalendarDate(2026, 2, 31)).toBe(false);
    expect(isRealCalendarDate(2026, 4, 31)).toBe(false);
  });

  // Protects against month numbers outside 1-12.
  it("returns false for month 13 and month 0", () => {
    expect(isRealCalendarDate(2026, 13, 1)).toBe(false);
    expect(isRealCalendarDate(2026, 0, 1)).toBe(false);
  });

  // Protects against day 0.
  it("returns false for day 0", () => {
    expect(isRealCalendarDate(2026, 10, 0)).toBe(false);
  });

  // Protects the century rules: 2000 WAS a leap year, 1900 was NOT.
  it("follows the century leap-year rules (2000 yes, 1900 no)", () => {
    expect(isRealCalendarDate(2000, 2, 29)).toBe(true);
    expect(isRealCalendarDate(1900, 2, 29)).toBe(false);
  });
});

describe("startsWithRealCalendarDate", () => {
  // Protects that the date part of a date-time string is checked.
  it("returns true when the text starts with a real date", () => {
    expect(startsWithRealCalendarDate("2026-10-26T10:00:00Z")).toBe(true);
  });

  // Protects against an impossible date hidden in a date-time string.
  it("returns false when the text starts with 31 February", () => {
    expect(startsWithRealCalendarDate("2026-02-31T10:00:00Z")).toBe(false);
  });
});
