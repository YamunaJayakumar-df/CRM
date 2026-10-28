// Tests for buildOccurredAtWindow: the date maths behind GET /interactions
// ?range= and ?from=/?to=.
//
// The function is pure (no clock, no database): "today" is passed in, so every
// test fixes it to "2026-10-26". India is UTC+05:30, so the START of a Kolkata
// day is 18:30 UTC on the day before (e.g. 26 Oct 00:00 IST = 25 Oct 18:30Z).
import { describe, it, expect } from "vitest";
import {
  DATE_RANGES,
  buildOccurredAtWindow,
  isDateRange,
} from "./interactionDateWindow.js";

const TODAY = "2026-10-26";

// Start of tomorrow (27 Oct) in India: the "lt" end of every quick range.
const START_OF_TOMORROW = new Date("2026-10-26T18:30:00.000Z");

describe("buildOccurredAtWindow with ?range=", () => {
  // Protects "7d" = today and the 6 days before (20 Oct to 26 Oct, both included).
  it("7d covers today and the 6 days before, in Kolkata days", () => {
    const window = buildOccurredAtWindow({ range: "7d" }, TODAY);

    expect(window).toEqual({
      gte: new Date("2026-10-19T18:30:00.000Z"), // 20 Oct 00:00 IST
      lt: START_OF_TOMORROW,
    });
  });

  // Protects "30d" = 27 Sep to 26 Oct.
  it("30d starts 29 days before today", () => {
    const window = buildOccurredAtWindow({ range: "30d" }, TODAY);

    expect(window).toEqual({
      gte: new Date("2026-09-26T18:30:00.000Z"), // 27 Sep 00:00 IST
      lt: START_OF_TOMORROW,
    });
  });

  // Protects "90d" = 29 Jul to 26 Oct (crosses several month ends).
  it("90d starts 89 days before today", () => {
    const window = buildOccurredAtWindow({ range: "90d" }, TODAY);

    expect(window).toEqual({
      gte: new Date("2026-07-28T18:30:00.000Z"), // 29 Jul 00:00 IST
      lt: START_OF_TOMORROW,
    });
  });

  // Protects ranges that cross New Year: 28 Dec 2026 to 3 Jan 2027.
  it("7d works across a year end", () => {
    const window = buildOccurredAtWindow({ range: "7d" }, "2027-01-03");

    expect(window).toEqual({
      gte: new Date("2026-12-27T18:30:00.000Z"), // 28 Dec 00:00 IST
      lt: new Date("2027-01-03T18:30:00.000Z"), // 4 Jan 00:00 IST
    });
  });

  // Protects against a route bug that lets range and from/to through together.
  it("throws when range is combined with from", () => {
    expect(() =>
      buildOccurredAtWindow({ range: "7d", from: "2026-10-01" }, TODAY),
    ).toThrow("use either range or from/to");
  });

  // Same protection for range + to.
  it("throws when range is combined with to", () => {
    expect(() =>
      buildOccurredAtWindow({ range: "30d", to: "2026-10-05" }, TODAY),
    ).toThrow("use either range or from/to");
  });
});

describe("buildOccurredAtWindow with ?from= / ?to=", () => {
  // Protects "from" alone: only a lower limit, starting at 00:00 IST that day.
  it("from alone gives only gte", () => {
    const window = buildOccurredAtWindow({ from: "2026-10-01" }, TODAY);

    expect(window).toEqual({ gte: new Date("2026-09-30T18:30:00.000Z") });
  });

  // Protects "to" alone: the whole `to` day is included (lt = start of the next day).
  it("to alone gives only lt, at the start of the next day", () => {
    const window = buildOccurredAtWindow({ to: "2026-10-05" }, TODAY);

    expect(window).toEqual({ lt: new Date("2026-10-05T18:30:00.000Z") });
  });

  // Protects from === to: exactly one Kolkata day (24 hours), not empty.
  it("from equal to to covers exactly one Kolkata day", () => {
    const window = buildOccurredAtWindow(
      { from: "2026-10-26", to: "2026-10-26" },
      TODAY,
    );

    expect(window).toEqual({
      gte: new Date("2026-10-25T18:30:00.000Z"),
      lt: new Date("2026-10-26T18:30:00.000Z"),
    });
    const hours = (window.lt!.getTime() - window.gte!.getTime()) / 3_600_000;
    expect(hours).toBe(24);
  });

  // Protects the month/year end: "to 31 Dec" must end at 1 Jan 00:00 IST.
  it("to on 31 December ends at the start of 1 January in Kolkata", () => {
    const window = buildOccurredAtWindow({ to: "2026-12-31" }, TODAY);

    expect(window).toEqual({ lt: new Date("2026-12-31T18:30:00.000Z") });
  });

  // Protects that "from"/"to" do not depend on today at all.
  it("ignores today when from and to are given", () => {
    const filters = { from: "2026-10-01", to: "2026-10-05" };

    expect(buildOccurredAtWindow(filters, "2026-10-26")).toEqual(
      buildOccurredAtWindow(filters, "2030-01-01"),
    );
  });

  // Protects "no date filter" -> no window, so plain lists stay unchanged.
  it("returns an empty window for empty filters", () => {
    expect(buildOccurredAtWindow({}, TODAY)).toEqual({});
  });
});

describe("isDateRange", () => {
  // Protects the list of accepted quick ranges.
  it("accepts exactly 7d, 30d and 90d", () => {
    expect(DATE_RANGES).toEqual(["7d", "30d", "90d"]);
    for (const range of DATE_RANGES) {
      expect(isDateRange(range)).toBe(true);
    }
  });

  // Protects against near-misses and non-strings (e.g. a repeated ?range= array).
  it("rejects anything else", () => {
    for (const value of ["7D", "7", "1y", " 7d", "", undefined, 7, ["7d"]]) {
      expect(isDateRange(value)).toBe(false);
    }
  });
});
