// Tests for firstLine.
import { describe, expect, it } from "vitest";
import { firstLine } from "./firstLine";

describe("firstLine", () => {
  it("returns the first line that has text, trimmed", () => {
    expect(firstLine("\n  Call back about pricing\nThen send quote")).toBe(
      "Call back about pricing",
    );
  });

  it("handles Windows line endings", () => {
    expect(firstLine("One\r\nTwo")).toBe("One");
  });

  it("returns an empty string for null, empty or blank text", () => {
    expect(firstLine(null)).toBe("");
    expect(firstLine("")).toBe("");
    expect(firstLine("  \n \n")).toBe("");
  });
});
