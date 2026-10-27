// Tests for linking inputs to their hint and error text.
import { describe, expect, it } from "vitest";
import { describedBy, errorId, hintId } from "./describedBy";

describe("hintId / errorId", () => {
  it("adds a suffix to the input id", () => {
    expect(hintId("customer-website")).toBe("customer-website-hint");
    expect(errorId("customer-email")).toBe("customer-email-error");
  });
});

describe("describedBy", () => {
  it("is undefined with no hint and no error", () => {
    expect(describedBy("a", { hasHint: false, hasError: false })).toBeUndefined();
  });

  it("lists the hint, the error, or both (hint first)", () => {
    expect(describedBy("a", { hasHint: true, hasError: false })).toBe("a-hint");
    expect(describedBy("a", { hasHint: false, hasError: true })).toBe("a-error");
    expect(describedBy("a", { hasHint: true, hasError: true })).toBe("a-hint a-error");
  });
});
