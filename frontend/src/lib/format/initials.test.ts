// Tests for avatar initials.
import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it("uses the first letters of the first two words", () => {
    expect(initialsOf("Acme Corp")).toBe("AC");
    expect(initialsOf("acme global services")).toBe("AG");
  });

  it("uses the first two letters of a single word", () => {
    expect(initialsOf("BrightTech")).toBe("BR");
    expect(initialsOf("X")).toBe("X");
  });

  it("ignores extra spaces, tabs and newlines", () => {
    expect(initialsOf("  Acme    Corp  ")).toBe("AC");
    expect(initialsOf("\tAcme\nCorp")).toBe("AC");
  });

  it("returns ? for empty, blank or null names", () => {
    expect(initialsOf("")).toBe("?");
    expect(initialsOf("    ")).toBe("?");
    expect(initialsOf(null)).toBe("?");
  });

  it("does not split characters made of two code units", () => {
    expect(initialsOf("😀 Smile")).toBe("😀S");
    expect(initialsOf("Émile Zola")).toBe("ÉZ");
  });
});
