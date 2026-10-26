// Tests for the dashboard follow-up filter (URL <-> backend filters).
import { describe, expect, it } from "vitest";
import {
  chipCounts,
  followUpFiltersFor,
  followUpViewHref,
  readFollowUpChip,
  readFollowUpSearch,
} from "./followUpView";

describe("readFollowUpChip", () => {
  it("reads a known chip", () => {
    expect(readFollowUpChip("open")).toBe("open");
    expect(readFollowUpChip("overdue")).toBe("overdue");
    expect(readFollowUpChip("done")).toBe("done");
  });

  it("falls back to all for missing or unknown values", () => {
    expect(readFollowUpChip(undefined)).toBe("all");
    expect(readFollowUpChip("OPEN")).toBe("all");
    expect(readFollowUpChip("nonsense")).toBe("all");
  });

  it("uses the first value when the param is repeated", () => {
    expect(readFollowUpChip(["done", "open"])).toBe("done");
  });
});

describe("readFollowUpSearch", () => {
  it("trims the text and returns empty for missing values", () => {
    expect(readFollowUpSearch("  acme ")).toBe("acme");
    expect(readFollowUpSearch(undefined)).toBe("");
    expect(readFollowUpSearch(["  x", "y"])).toBe("x");
  });

  it("caps the text at 100 characters", () => {
    expect(readFollowUpSearch("a".repeat(150))).toHaveLength(100);
  });
});

describe("followUpFiltersFor", () => {
  it("maps each chip to backend filters with a limit of 5", () => {
    expect(followUpFiltersFor("all", "")).toEqual({ q: undefined, limit: 5 });
    expect(followUpFiltersFor("open", "")).toEqual({ status: "OPEN", q: undefined, limit: 5 });
    expect(followUpFiltersFor("overdue", "")).toEqual({ due: "overdue", q: undefined, limit: 5 });
    expect(followUpFiltersFor("done", "")).toEqual({ status: "DONE", q: undefined, limit: 5 });
  });

  it("passes the search text as q", () => {
    expect(followUpFiltersFor("open", "acme")).toEqual({ status: "OPEN", q: "acme", limit: 5 });
  });
});

describe("followUpViewHref", () => {
  it("leaves out the defaults", () => {
    expect(followUpViewHref("all", "")).toBe("/");
  });

  it("encodes the chip and search text", () => {
    expect(followUpViewHref("open", "R&D")).toBe("/?fu=open&fq=R%26D");
    expect(followUpViewHref("all", "acme")).toBe("/?fq=acme");
  });

  // Protects that switching chips or searching keeps the customer panel open.
  it("keeps the open customer when a customer id is given", () => {
    expect(followUpViewHref("open", "", 12)).toBe("/?fu=open&customer=12");
    expect(followUpViewHref("all", "acme", 7)).toBe("/?fq=acme&customer=7");
  });

  // Protects that the panel's Back link (no id) closes the panel.
  it("leaves the customer out when no id is given", () => {
    expect(followUpViewHref("open", "", null)).toBe("/?fu=open");
  });
});

describe("chipCounts", () => {
  it("counts all as open + done, with overdue included in open", () => {
    expect(chipCounts({ open: 5, overdue: 2, done: 3 })).toEqual({
      all: 8,
      open: 5,
      overdue: 2,
      done: 3,
    });
  });
});
