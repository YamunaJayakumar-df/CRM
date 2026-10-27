// Tests for the Follow-ups page's URL filters.
import { describe, expect, it } from "vitest";
import {
  DEFAULT_FOLLOW_UPS_STATE,
  dueFollowUpsHref,
  followUpsEmptyText,
  followUpsFiltersFor,
  followUpsHref,
  readFollowUpsState,
  readFollowUpsView,
} from "./followUpsView";

describe("readFollowUpsView", () => {
  it("accepts the five views", () => {
    expect(readFollowUpsView("today")).toBe("today");
    expect(readFollowUpsView("overdue")).toBe("overdue");
    expect(readFollowUpsView("done")).toBe("done");
    expect(readFollowUpsView("all")).toBe("all");
  });

  it("falls back to open for anything else", () => {
    expect(readFollowUpsView(undefined)).toBe("open");
    expect(readFollowUpsView("DONE")).toBe("open");
    expect(readFollowUpsView(["done", "all"])).toBe("done");
  });
});

describe("readFollowUpsState", () => {
  it("reads view, trimmed search and customer", () => {
    expect(readFollowUpsState({ view: "overdue", q: "  acme ", customerId: "12" })).toEqual({
      view: "overdue",
      search: "acme",
      customerId: 12,
    });
  });

  it("ignores a bad customer id and cuts long searches", () => {
    const state = readFollowUpsState({ customerId: "12abc", q: "x".repeat(150) });
    expect(state.customerId).toBeNull();
    expect(state.search).toHaveLength(100);
  });

  it("gives the defaults for an empty URL", () => {
    expect(readFollowUpsState({})).toEqual(DEFAULT_FOLLOW_UPS_STATE);
  });
});

describe("followUpsHref", () => {
  it("is the plain page for the defaults", () => {
    expect(followUpsHref(DEFAULT_FOLLOW_UPS_STATE)).toBe("/follow-ups");
  });

  it("adds every non-default value, encoded", () => {
    expect(followUpsHref({ view: "overdue", search: "R&D", customerId: 12 })).toBe(
      "/follow-ups?view=overdue&q=R%26D&customerId=12",
    );
  });
});

describe("followUpsFiltersFor", () => {
  const base = { search: "", customerId: null };

  it("maps each view to the backend filter", () => {
    expect(followUpsFiltersFor({ ...base, view: "today" }, 200)).toEqual({
      q: undefined,
      customerId: undefined,
      limit: 200,
      due: "today",
    });
    expect(followUpsFiltersFor({ ...base, view: "overdue" }, 200).due).toBe("overdue");
    expect(followUpsFiltersFor({ ...base, view: "open" }, 200).status).toBe("OPEN");
    expect(followUpsFiltersFor({ ...base, view: "done" }, 200).status).toBe("DONE");
  });

  it("sends no status or due filter for all", () => {
    const filters = followUpsFiltersFor({ ...base, view: "all" }, 200);
    expect(filters.status).toBeUndefined();
    expect(filters.due).toBeUndefined();
  });

  it("passes the search and customer on", () => {
    expect(followUpsFiltersFor({ view: "all", search: "acme", customerId: 12 }, 50)).toEqual({
      q: "acme",
      customerId: 12,
      limit: 50,
    });
  });
});

describe("followUpsEmptyText", () => {
  it("talks about matching when a search or customer is set", () => {
    expect(followUpsEmptyText({ view: "today", search: "x", customerId: null }).message).toBe(
      "No follow-ups match",
    );
  });

  it("has a message per view", () => {
    expect(followUpsEmptyText({ view: "today", search: "", customerId: null }).message).toBe(
      "Nothing due today",
    );
    expect(followUpsEmptyText({ view: "overdue", search: "", customerId: null }).message).toBe(
      "Nothing overdue",
    );
  });
});

describe("dueFollowUpsHref", () => {
  it("prefers overdue, then due today, then open", () => {
    expect(dueFollowUpsHref({ overdue: 2, dueToday: 1 })).toBe("/follow-ups?view=overdue");
    expect(dueFollowUpsHref({ overdue: 0, dueToday: 1 })).toBe("/follow-ups?view=today");
    expect(dueFollowUpsHref({ overdue: 0, dueToday: 0 })).toBe("/follow-ups");
  });
});
