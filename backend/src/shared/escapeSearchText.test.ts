// Tests for escapeSearchText. They protect that "%" and "_" in a search are
// matched literally, instead of acting as "match anything" wildcards.
import { describe, it, expect } from "vitest";
import { escapeSearchText } from "./escapeSearchText.js";

describe("escapeSearchText", () => {
  // Protects that ordinary search text is passed through unchanged.
  it("leaves normal text unchanged", () => {
    expect(escapeSearchText("Acme Corp")).toBe("Acme Corp");
  });

  // Protects against "%" matching every customer.
  it("escapes the % wildcard", () => {
    expect(escapeSearchText("100%")).toBe("100\\%");
  });

  // Protects against "_" matching any single character.
  it("escapes the _ wildcard", () => {
    expect(escapeSearchText("acme_corp")).toBe("acme\\_corp");
  });

  // Protects that a backslash typed by the user is also matched literally.
  it("escapes a backslash", () => {
    expect(escapeSearchText("a\\b")).toBe("a\\\\b");
  });
});
