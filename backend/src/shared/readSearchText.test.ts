// Tests for readSearchText, which reads the optional ?q= search text of a list URL.
// It is a plain function, so we call it directly. These tests protect the
// shared search rules: one value, trimmed, blank means "no search", max 100 characters.
import { describe, it, expect } from "vitest";
import { readSearchText } from "./readSearchText.js";

describe("readSearchText", () => {
  // Protects that a list without ?q= is not filtered.
  it("returns no search when q is not sent", () => {
    expect(readSearchText(undefined)).toEqual({ ok: true, search: undefined });
  });

  // Protects that spaces around the text are ignored.
  it("trims the search text", () => {
    expect(readSearchText("  acme ")).toEqual({ ok: true, search: "acme" });
  });

  // Protects that a blank search shows everything instead of matching "".
  it("returns no search for empty or whitespace-only text", () => {
    for (const raw of ["", "   "]) {
      expect(readSearchText(raw)).toEqual({ ok: true, search: undefined });
    }
  });

  // Protects the length limit: exactly 100 characters is allowed.
  it("accepts 100 characters", () => {
    const text = "a".repeat(100);

    expect(readSearchText(text)).toEqual({ ok: true, search: text });
  });

  // Protects the length limit: 101 characters is rejected.
  it("rejects 101 characters with the exact message", () => {
    expect(readSearchText("a".repeat(101))).toEqual({
      ok: false,
      error: "q must be at most 100 characters",
    });
  });

  // Protects that the limit counts characters AFTER trimming.
  it("measures the length after trimming", () => {
    expect(readSearchText("  " + "a".repeat(100) + "  ").ok).toBe(true);
  });

  // Protects against a repeated ?q=a&q=b, which Express gives as an array.
  it("rejects an array with the exact message", () => {
    expect(readSearchText(["a", "b"])).toEqual({
      ok: false,
      error: "q must be a single search text",
    });
  });
});
