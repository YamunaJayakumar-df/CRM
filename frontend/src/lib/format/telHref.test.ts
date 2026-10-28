// Tests for telHref.
import { describe, expect, it } from "vitest";
import { telHref } from "./telHref";

describe("telHref", () => {
  it("keeps only digits and a leading plus", () => {
    expect(telHref(" +91 98450-12345 ")).toBe("tel:+919845012345");
    expect(telHref("(080) 4123 4567")).toBe("tel:08041234567");
  });

  it("drops a plus that is not at the start", () => {
    expect(telHref("080+123")).toBe("tel:080123");
  });

  it("returns null when there are no digits", () => {
    expect(telHref(null)).toBeNull();
    expect(telHref("")).toBeNull();
    expect(telHref("   ")).toBeNull();
    expect(telHref("n/a")).toBeNull();
    expect(telHref("+")).toBeNull();
  });

  it("never lets other link text through", () => {
    expect(telHref("javascript:alert(1)")).toBe("tel:1");
  });
});
