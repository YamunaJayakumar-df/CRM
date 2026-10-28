// Tests for parseLimit, which reads the optional ?limit= value of a list URL.
// It is a plain function, so we call it directly. These tests protect the
// rule that a limit is a whole number from 1 to the route's safety limit.
import { describe, it, expect } from "vitest";
import { parseLimit } from "./parseLimit.js";

const MAX = 500;
const LIMIT_ERROR = "limit must be a whole number from 1 to 500";

describe("parseLimit", () => {
  // Protects that a list without ?limit= behaves as before (the safety limit).
  it("returns the max limit when no limit is sent", () => {
    expect(parseLimit(undefined, MAX)).toEqual({ ok: true, limit: 500 });
  });

  // Protects the smallest and the largest allowed values.
  it("accepts 1 and the max limit", () => {
    expect(parseLimit("1", MAX)).toEqual({ ok: true, limit: 1 });
    expect(parseLimit("500", MAX)).toEqual({ ok: true, limit: 500 });
  });

  // Protects a normal value in between (e.g. "the 5 newest" on the dashboard).
  it("accepts a value in between", () => {
    expect(parseLimit("5", MAX)).toEqual({ ok: true, limit: 5 });
  });

  // Protects against zero, too-large, negative, decimal, empty and non-number text.
  for (const raw of ["0", "501", "-1", "1.5", "abc", ""]) {
    it(`rejects ${JSON.stringify(raw)} with the exact message`, () => {
      expect(parseLimit(raw, MAX)).toEqual({ ok: false, error: LIMIT_ERROR });
    });
  }

  // Protects against a repeated ?limit=1&limit=2, which Express gives as an array.
  it("rejects an array (repeated ?limit=)", () => {
    expect(parseLimit(["1", "2"], MAX)).toEqual({ ok: false, error: LIMIT_ERROR });
  });

  // Protects that the message names the max limit the route actually uses.
  it("uses the given max limit in the check and the message", () => {
    expect(parseLimit("11", 10)).toEqual({
      ok: false,
      error: "limit must be a whole number from 1 to 10",
    });
  });
});
