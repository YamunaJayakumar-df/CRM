// Tests for building backend query strings.
import { describe, expect, it } from "vitest";
import { buildQueryString } from "./buildQueryString";

describe("buildQueryString", () => {
  it("returns an empty string when there is nothing to send", () => {
    expect(buildQueryString({})).toBe("");
    expect(buildQueryString({ q: undefined, limit: undefined })).toBe("");
    expect(buildQueryString({ q: "   " })).toBe("");
  });

  it("joins parameters in the given order", () => {
    expect(buildQueryString({ status: "OPEN", due: "today", limit: 5 })).toBe(
      "?status=OPEN&due=today&limit=5",
    );
  });

  it("encodes user text so it cannot add extra parameters", () => {
    expect(buildQueryString({ q: "R&D Ltd" })).toBe("?q=R%26D+Ltd");
    expect(buildQueryString({ q: "a=1&limit=9999" })).toBe("?q=a%3D1%26limit%3D9999");
    expect(buildQueryString({ q: "ವಿಜಯ" })).toBe("?q=%E0%B2%B5%E0%B2%BF%E0%B2%9C%E0%B2%AF");
  });

  it("trims strings and keeps 0", () => {
    expect(buildQueryString({ q: "  acme  " })).toBe("?q=acme");
    expect(buildQueryString({ limit: 0 })).toBe("?limit=0");
  });

  it("throws for NaN or Infinity numbers", () => {
    expect(() => buildQueryString({ customerId: Number.NaN })).toThrow(
      'Query parameter "customerId" must be a finite number',
    );
    expect(() => buildQueryString({ limit: Number.POSITIVE_INFINITY })).toThrow("finite");
  });
});
