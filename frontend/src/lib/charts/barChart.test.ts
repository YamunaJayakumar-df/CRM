// Tests for the Activity bar chart's maths (no drawing, no browser).
import { describe, expect, it } from "vitest";
import {
  barBoxes,
  daysEndingOn,
  gridValues,
  longDayLabel,
  MAX_BAR_WIDTH,
  niceMax,
  roundedTopBarPath,
  shortDayLabel,
} from "./barChart";

describe("niceMax", () => {
  it("never goes below 4", () => {
    expect(niceMax(0)).toBe(4);
    expect(niceMax(3)).toBe(4);
  });

  it("rounds up to a nice number", () => {
    expect(niceMax(5)).toBe(5);
    expect(niceMax(6)).toBe(10);
    expect(niceMax(13)).toBe(20);
    expect(niceMax(21)).toBe(25);
    expect(niceMax(41)).toBe(50);
    expect(niceMax(120)).toBe(200);
  });
});

describe("gridValues", () => {
  it("adds a middle line only when it is a whole number", () => {
    expect(gridValues(4)).toEqual([0, 2, 4]);
    expect(gridValues(5)).toEqual([0, 5]);
  });
});

describe("barBoxes", () => {
  it("puts each bar in the middle of its slot, growing up from the bottom", () => {
    const [first, second] = barBoxes([2, 4], 100, 80, 4);
    // Slot 50, bar 60% of it = 30, capped at 24, centred: x = (50 - 24) / 2.
    expect(first).toEqual({ x: 13, y: 40, width: 24, height: 40 });
    expect(second).toEqual({ x: 63, y: 0, width: 24, height: 80 });
  });

  it("never makes a bar thicker than the maximum", () => {
    expect(barBoxes([1], 1000, 80, 4)[0]?.width).toBe(MAX_BAR_WIDTH);
  });

  it("gives zero a height of 0", () => {
    expect(barBoxes([0], 100, 80, 4)[0]?.height).toBe(0);
  });

  it("handles no data", () => {
    expect(barBoxes([], 100, 80, 4)).toEqual([]);
  });
});

describe("roundedTopBarPath", () => {
  it("draws a rounded top and a square bottom", () => {
    expect(roundedTopBarPath({ x: 0, y: 10, width: 20, height: 30 })).toBe(
      "M0,40 V14 Q0,10 4,10 H16 Q20,10 20,14 V40 Z",
    );
  });

  it("uses a smaller radius for a very short bar", () => {
    expect(roundedTopBarPath({ x: 0, y: 38, width: 20, height: 2 })).toBe("M0,40 V40 Q0,38 2,38 H18 Q20,38 20,40 V40 Z");
  });

  it("draws nothing for an empty bar", () => {
    expect(roundedTopBarPath({ x: 0, y: 40, width: 20, height: 0 })).toBe("");
  });
});

describe("days and labels", () => {
  it("lists the days ending today, oldest first, across a month end", () => {
    expect(daysEndingOn("2026-11-02", 4)).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  });

  it("formats short and long day labels", () => {
    expect(shortDayLabel("2026-10-28")).toBe("Oct 28");
    expect(longDayLabel("2026-10-28")).toBe("Wed, Oct 28");
  });
});
