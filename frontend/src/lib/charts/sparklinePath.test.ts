// Tests for the sparkline path maths.
import { describe, expect, it } from "vitest";
import { sparklinePaths } from "./sparklinePath";

const box = { width: 100, height: 40, padding: 4 };

describe("sparklinePaths", () => {
  it("puts the biggest value at the top padding and 0 at the bottom padding", () => {
    const { line } = sparklinePaths([0, 10], box);
    expect(line).toBe("M 0 36 L 100 4");
  });

  it("curves through the midpoints between points", () => {
    const { line } = sparklinePaths([0, 10, 0], box);
    expect(line).toBe("M 0 36 Q 50 4 75 20 L 100 36");
  });

  it("draws a flat line near the bottom for all-zero data", () => {
    const { line } = sparklinePaths([0, 0, 0], box);
    expect(line).toBe("M 0 36 Q 50 36 75 36 L 100 36");
  });

  it("draws a flat line for empty or single-value data", () => {
    expect(sparklinePaths([], box).line).toBe("M 0 36 L 100 36");
    expect(sparklinePaths([5], box).line).toBe("M 0 36 L 100 36");
  });

  it("treats negative and non-finite values as 0", () => {
    const { line } = sparklinePaths([-3, Number.NaN, 4], box);
    expect(line).toBe("M 0 36 Q 50 36 75 20 L 100 4");
  });

  it("closes the area along the bottom edge", () => {
    const { area } = sparklinePaths([0, 10], box);
    expect(area).toBe("M 0 36 L 100 4 L 100 40 L 0 40 Z");
  });
});
