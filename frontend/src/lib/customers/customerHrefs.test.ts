// Tests for the customer page links.
import { describe, expect, it } from "vitest";
import {
  customerEditHref,
  customerPageHref,
  customersListHref,
  readCustomerSearch,
} from "./customerHrefs";

describe("readCustomerSearch", () => {
  it("trims the text and takes the first value", () => {
    expect(readCustomerSearch("  acme ")).toBe("acme");
    expect(readCustomerSearch(["one", "two"])).toBe("one");
  });

  it("gives empty text when missing", () => {
    expect(readCustomerSearch(undefined)).toBe("");
  });

  it("cuts very long text to 100 characters", () => {
    expect(readCustomerSearch("a".repeat(150))).toHaveLength(100);
  });
});

describe("customersListHref", () => {
  it("leaves out an empty search", () => {
    expect(customersListHref("")).toBe("/customers");
  });

  it("encodes the search text", () => {
    expect(customersListHref("R&D")).toBe("/customers?q=R%26D");
  });
});

describe("customerPageHref", () => {
  it("links to the customer's page, Overview tab by default", () => {
    expect(customerPageHref(34)).toBe("/customers/34");
    expect(customerPageHref(34, "overview")).toBe("/customers/34");
  });

  it("adds the other tabs to the URL", () => {
    expect(customerPageHref(34, "interactions")).toBe("/customers/34?tab=interactions");
    expect(customerPageHref(34, "follow-ups")).toBe("/customers/34?tab=follow-ups");
    expect(customerPageHref(34, "notes")).toBe("/customers/34?tab=notes");
  });
});

describe("customerEditHref", () => {
  it("links to the edit page", () => {
    expect(customerEditHref(12)).toBe("/customers/12/edit");
  });

  it("adds an encoded returnTo", () => {
    expect(customerEditHref(12, "/?fu=open&customer=12")).toBe(
      "/customers/12/edit?returnTo=%2F%3Ffu%3Dopen%26customer%3D12",
    );
  });
});
