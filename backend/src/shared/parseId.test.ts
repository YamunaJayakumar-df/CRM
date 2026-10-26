// Tests for parseId(): turning the ":id" text from a URL into a database id.
// If this lets bad text through, routes would send garbage to the database;
// if it rejects good ids, real customers could not be opened.
import { describe, it, expect } from "vitest";
import { isValidId, parseId } from "./parseId.js";

describe("parseId", () => {
  // Protects the normal case: a plain number in the URL becomes that number.
  it("returns the number for simple digit strings", () => {
    expect(parseId("1")).toBe(1);
    expect(parseId("12")).toBe(12);
  });

  // Protects that leading zeros are harmless ("007" means id 7).
  it("accepts leading zeros", () => {
    expect(parseId("007")).toBe(7);
  });

  // Protects the upper boundary: the largest number a Postgres Int can hold is still valid.
  it("accepts the largest database Int (2147483647)", () => {
    expect(parseId("2147483647")).toBe(2147483647);
  });

  // Protects that ids start at 1; 0 can never be a real id.
  it("rejects 0", () => {
    expect(parseId("0")).toBeNull();
  });

  // Protects against negative ids.
  it("rejects negative numbers", () => {
    expect(parseId("-3")).toBeNull();
  });

  // Protects against non-numeric text.
  it("rejects letters", () => {
    expect(parseId("abc")).toBeNull();
  });

  // Protects against decimals, which can never be an Int id.
  it("rejects decimals", () => {
    expect(parseId("1.5")).toBeNull();
  });

  // Protects against an empty id.
  it("rejects an empty string", () => {
    expect(parseId("")).toBeNull();
  });

  // Protects against spaces around the number (Number(" 7") would quietly give 7).
  it("rejects leading or trailing spaces", () => {
    expect(parseId(" 7")).toBeNull();
    expect(parseId("7 ")).toBeNull();
  });

  // Protects against scientific notation (Number("1e3") would quietly give 1000).
  it("rejects scientific notation", () => {
    expect(parseId("1e3")).toBeNull();
  });

  // Protects the upper boundary: one more than the largest Int is rejected.
  it("rejects 2147483648 (one above the largest database Int)", () => {
    expect(parseId("2147483648")).toBeNull();
  });

  // Protects against huge numbers that would overflow the database column.
  it("rejects a very large number", () => {
    expect(parseId("99999999999999999999")).toBeNull();
  });
});

// isValidId() checks ids that arrive inside a JSON body (already numbers),
// e.g. an interaction's customerId.
describe("isValidId", () => {
  // Protects the normal case and the upper boundary of a Postgres Int.
  it("returns true for 1 and the largest database Int", () => {
    expect(isValidId(1)).toBe(true);
    expect(isValidId(2147483647)).toBe(true);
  });

  // Protects that ids start at 1.
  it("returns false for 0 and negative numbers", () => {
    expect(isValidId(0)).toBe(false);
    expect(isValidId(-1)).toBe(false);
  });

  // Protects against decimals, which can never be an Int id.
  it("returns false for a decimal", () => {
    expect(isValidId(1.5)).toBe(false);
  });

  // Protects the upper boundary: one more than the largest Int is rejected.
  it("returns false for 2147483648", () => {
    expect(isValidId(2147483648)).toBe(false);
  });

  // Protects that a number written as text ("12") is NOT accepted in a JSON body.
  it("returns false for a numeric string", () => {
    expect(isValidId("12")).toBe(false);
  });

  // Protects against special number values that are not real numbers.
  it("returns false for NaN and Infinity", () => {
    expect(isValidId(NaN)).toBe(false);
    expect(isValidId(Infinity)).toBe(false);
  });

  // Protects against missing values.
  it("returns false for null and undefined", () => {
    expect(isValidId(null)).toBe(false);
    expect(isValidId(undefined)).toBe(false);
  });
});
