// Tests for the control-character checks. They protect against text that
// Postgres refuses (NUL) or that is never useful in CRM fields.
import { describe, it, expect } from "vitest";
import {
  hasControlCharacters,
  hasControlCharactersInMultilineText,
  normalizeLineBreaks,
} from "./textChecks.js";

describe("hasControlCharacters (single-line text)", () => {
  // Protects that normal text, including accents and symbols, is allowed.
  it("returns false for normal text", () => {
    expect(hasControlCharacters("Acme Ltd")).toBe(false);
    expect(hasControlCharacters("Café & Co. (Pvt) – ₹")).toBe(false);
  });

  // Protects against NUL, which would make Postgres throw a 500 error.
  it("returns true for a NUL character", () => {
    expect(hasControlCharacters("Acme\u0000")).toBe(true);
  });

  // Protects that names/emails/phones stay on one line.
  it("returns true for newline, tab and DEL", () => {
    expect(hasControlCharacters("Acme\nLtd")).toBe(true);
    expect(hasControlCharacters("Acme\tLtd")).toBe(true);
    expect(hasControlCharacters("Acme\u007F")).toBe(true);
  });
});

describe("hasControlCharactersInMultilineText (notes)", () => {
  // Protects that notes may contain line breaks and tabs.
  it("returns false for text with newlines and tabs", () => {
    expect(hasControlCharactersInMultilineText("Line 1\r\nLine 2\tend")).toBe(
      false,
    );
  });

  // Protects that NUL is still rejected in notes.
  it("returns true for a NUL character", () => {
    expect(hasControlCharactersInMultilineText("Note\u0000")).toBe(true);
  });
});

describe("normalizeLineBreaks", () => {
  // Protects that browser "\r\n" line breaks are stored as plain "\n".
  it("turns \\r\\n and lone \\r into \\n", () => {
    expect(normalizeLineBreaks("Line 1\r\nLine 2\rLine 3\nLine 4")).toBe(
      "Line 1\nLine 2\nLine 3\nLine 4",
    );
  });

  // Protects that text without line breaks is unchanged.
  it("leaves single-line text unchanged", () => {
    expect(normalizeLineBreaks("Acme Corp")).toBe("Acme Corp");
  });
});
