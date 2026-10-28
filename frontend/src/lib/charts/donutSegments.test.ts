// Tests for the donut chart maths.
import { describe, expect, it } from "vitest";
import { donutSegments } from "./donutSegments";

describe("donutSegments", () => {
  it("splits the outline in proportion to the counts, one after another", () => {
    expect(donutSegments([1, 3], 100)).toEqual([
      { length: 25, start: 0 },
      { length: 75, start: 25 },
    ]);
  });

  it("gives zero-length pieces for zero counts", () => {
    expect(donutSegments([2, 0, 2], 100)).toEqual([
      { length: 50, start: 0 },
      { length: 0, start: 50 },
      { length: 50, start: 50 },
    ]);
  });

  it("gives all zero lengths when every count is 0", () => {
    expect(donutSegments([0, 0, 0], 100)).toEqual([
      { length: 0, start: 0 },
      { length: 0, start: 0 },
      { length: 0, start: 0 },
    ]);
  });

  it("treats negative and non-finite counts as 0", () => {
    expect(donutSegments([-1, Number.NaN, 4], 100)).toEqual([
      { length: 0, start: 0 },
      { length: 0, start: 0 },
      { length: 100, start: 0 },
    ]);
  });
});
