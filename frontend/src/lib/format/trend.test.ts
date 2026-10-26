// Tests for dashboard trend maths.
import { describe, expect, it } from "vitest";
import { sumLast, weekChange } from "./trend";

describe("weekChange", () => {
  it("reports up, down and same with a positive amount", () => {
    expect(weekChange(12, 9)).toEqual({ direction: "up", amount: 3 });
    expect(weekChange(4, 10)).toEqual({ direction: "down", amount: 6 });
    expect(weekChange(5, 5)).toEqual({ direction: "same", amount: 0 });
  });

  it("handles zero weeks", () => {
    expect(weekChange(0, 0)).toEqual({ direction: "same", amount: 0 });
    expect(weekChange(3, 0)).toEqual({ direction: "up", amount: 3 });
    expect(weekChange(0, 3)).toEqual({ direction: "down", amount: 3 });
  });

  it("throws for NaN or Infinity", () => {
    expect(() => weekChange(Number.NaN, 1)).toThrow("finite");
    expect(() => weekChange(1, Number.POSITIVE_INFINITY)).toThrow("finite");
  });
});

describe("sumLast", () => {
  it("sums the newest n values (end of the array)", () => {
    expect(sumLast([1, 2, 3, 4], 2)).toBe(7);
    expect(sumLast([1, 2, 3, 4], 4)).toBe(10);
  });

  it("sums everything when n is larger than the array", () => {
    expect(sumLast([1, 2], 7)).toBe(3);
  });

  it("returns 0 for n = 0 or an empty array", () => {
    expect(sumLast([1, 2, 3], 0)).toBe(0);
    expect(sumLast([], 7)).toBe(0);
  });

  it("throws for a negative or fractional n", () => {
    expect(() => sumLast([1, 2], -1)).toThrow("whole number");
    expect(() => sumLast([1, 2], 1.5)).toThrow("whole number");
  });
});
