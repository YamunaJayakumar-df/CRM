// Tests for reading a customer id and tab from the URL.
import { describe, expect, it } from "vitest";
import { readCustomerId, readCustomerTab } from "./customerPanelView";

describe("readCustomerId", () => {
  it("reads a positive whole number", () => {
    expect(readCustomerId("12")).toBe(12);
    expect(readCustomerId("007")).toBe(7);
    expect(readCustomerId(["5", "6"])).toBe(5);
  });

  it("rejects anything that is not digits only", () => {
    expect(readCustomerId(undefined)).toBeNull();
    expect(readCustomerId("")).toBeNull();
    expect(readCustomerId("12abc")).toBeNull();
    expect(readCustomerId("-3")).toBeNull();
    expect(readCustomerId("1.5")).toBeNull();
    expect(readCustomerId(" 12")).toBeNull();
    expect(readCustomerId("1e3")).toBeNull();
  });

  it("rejects 0 and ids too large for the database", () => {
    expect(readCustomerId("0")).toBeNull();
    expect(readCustomerId("2147483647")).toBe(2147483647);
    expect(readCustomerId("2147483648")).toBeNull();
    expect(readCustomerId("99999999999999999999")).toBeNull();
  });
});

describe("readCustomerTab", () => {
  it("reads a known tab", () => {
    expect(readCustomerTab("interactions")).toBe("interactions");
    expect(readCustomerTab("follow-ups")).toBe("follow-ups");
    expect(readCustomerTab("notes")).toBe("notes");
  });

  it("falls back to overview for missing, unknown or not-yet-built tabs", () => {
    expect(readCustomerTab(undefined)).toBe("overview");
    expect(readCustomerTab("files")).toBe("overview");
    expect(readCustomerTab("NOTES")).toBe("overview");
  });
});
