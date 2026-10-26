// Tests for mailtoHref.
import { describe, expect, it } from "vitest";
import { mailtoHref } from "./mailtoHref";

describe("mailtoHref", () => {
  it("encodes the trimmed address", () => {
    expect(mailtoHref(" ana@acme.com ")).toBe("mailto:ana%40acme.com");
  });

  it("encodes characters that could add extra fields", () => {
    expect(mailtoHref("a@b.com?cc=x@y.com")).toBe("mailto:a%40b.com%3Fcc%3Dx%40y.com");
  });

  it("returns null when blank", () => {
    expect(mailtoHref(null)).toBeNull();
    expect(mailtoHref("  ")).toBeNull();
  });
});
