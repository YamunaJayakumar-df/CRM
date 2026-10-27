// Tests for the returnTo safety check (no redirects to other websites).
import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./safeReturnPath";

describe("safeReturnPath", () => {
  it("accepts paths inside the app", () => {
    expect(safeReturnPath("/")).toBe("/");
    expect(safeReturnPath("/customers")).toBe("/customers");
    expect(safeReturnPath("/?fu=open&customer=12&tab=notes")).toBe(
      "/?fu=open&customer=12&tab=notes",
    );
    expect(safeReturnPath("/customers?q=R%26D")).toBe("/customers?q=R%26D");
  });

  it("rejects links to other websites", () => {
    expect(safeReturnPath("https://evil.example")).toBeNull();
    expect(safeReturnPath("//evil.example")).toBeNull();
    expect(safeReturnPath("/\\evil.example")).toBeNull();
    expect(safeReturnPath("\\\\evil.example")).toBeNull();
    expect(safeReturnPath("javascript:alert(1)")).toBeNull();
  });

  it("rejects hidden control characters", () => {
    expect(safeReturnPath("/\t/evil.example")).toBeNull();
    expect(safeReturnPath("/\n/evil.example")).toBeNull();
    expect(safeReturnPath("/customers\u0000")).toBeNull();
  });

  it("rejects relative paths, blanks, very long text and non-text", () => {
    expect(safeReturnPath("customers")).toBeNull();
    expect(safeReturnPath("")).toBeNull();
    expect(safeReturnPath(" /customers")).toBeNull();
    expect(safeReturnPath(`/${"a".repeat(2000)}`)).toBeNull();
    expect(safeReturnPath(undefined)).toBeNull();
    expect(safeReturnPath(null)).toBeNull();
    expect(safeReturnPath(["/customers"])).toBeNull();
  });
});
