// Tests for the Interactions page URL helpers (URL <-> page state <-> backend filters).
import { describe, expect, it } from "vitest";
import {
  DEFAULT_INTERACTIONS_STATE,
  interactionFiltersFor,
  interactionsEmptyText,
  interactionsHref,
  readInteractionsRange,
  readInteractionsSearch,
  readInteractionsState,
  readInteractionsView,
} from "./interactionsView";

describe("readInteractionsView", () => {
  it("reads a known view", () => {
    expect(readInteractionsView("table")).toBe("table");
    expect(readInteractionsView("kanban")).toBe("kanban");
  });

  // Protects that odd URLs fall back to the board instead of breaking.
  it("falls back to kanban for missing or unknown values", () => {
    expect(readInteractionsView(undefined)).toBe("kanban");
    expect(readInteractionsView("TABLE")).toBe("kanban");
    expect(readInteractionsView(["table", "kanban"])).toBe("table");
  });
});

describe("readInteractionsRange", () => {
  it("reads every known range", () => {
    expect(readInteractionsRange("7d")).toBe("7d");
    expect(readInteractionsRange("30d")).toBe("30d");
    expect(readInteractionsRange("90d")).toBe("90d");
    expect(readInteractionsRange("all")).toBe("all");
  });

  // Protects the default: last 30 days.
  it("falls back to 30d for missing or unknown values", () => {
    expect(readInteractionsRange(undefined)).toBe("30d");
    expect(readInteractionsRange("365d")).toBe("30d");
  });
});

describe("readInteractionsSearch", () => {
  it("trims, caps at 100 characters and treats missing as empty", () => {
    expect(readInteractionsSearch("  renewal ")).toBe("renewal");
    expect(readInteractionsSearch(undefined)).toBe("");
    expect(readInteractionsSearch("a".repeat(150))).toHaveLength(100);
  });
});

describe("readInteractionsState", () => {
  it("returns the defaults for an empty URL", () => {
    expect(readInteractionsState({})).toEqual(DEFAULT_INTERACTIONS_STATE);
  });

  it("reads every param", () => {
    expect(
      readInteractionsState({ view: "table", range: "7d", q: " acme ", customerId: "12" }),
    ).toEqual({ view: "table", range: "7d", search: "acme", customerId: 12 });
  });

  // Protects that a bad customerId never reaches the backend.
  it("ignores a customerId that is not a positive whole number", () => {
    expect(readInteractionsState({ customerId: "12abc" }).customerId).toBeNull();
    expect(readInteractionsState({ customerId: "-3" }).customerId).toBeNull();
    expect(readInteractionsState({ customerId: "0" }).customerId).toBeNull();
  });
});

describe("interactionsHref", () => {
  it("leaves out the defaults", () => {
    expect(interactionsHref(DEFAULT_INTERACTIONS_STATE)).toBe("/interactions");
  });

  it("encodes every non-default value", () => {
    expect(
      interactionsHref({ view: "table", range: "7d", search: "R&D", customerId: 12 }),
    ).toBe("/interactions?view=table&range=7d&q=R%26D&customerId=12");
  });

  // Protects that "All time" survives a round trip through the URL.
  it("keeps the all-time range in the URL", () => {
    const href = interactionsHref({ ...DEFAULT_INTERACTIONS_STATE, range: "all" });
    expect(href).toBe("/interactions?range=all");
  });
});

describe("interactionFiltersFor", () => {
  it("passes the filters through with the limit and type", () => {
    expect(
      interactionFiltersFor({ view: "kanban", range: "7d", search: "acme", customerId: 5 }, 50, "CALL"),
    ).toEqual({ type: "CALL", q: "acme", range: "7d", customerId: 5, limit: 50 });
  });

  // Protects that "All time" and empty search send nothing to the backend.
  it("leaves out all-time, blank search and no customer", () => {
    expect(
      interactionFiltersFor({ view: "table", range: "all", search: "", customerId: null }, 100),
    ).toEqual({ type: undefined, q: undefined, range: undefined, customerId: undefined, limit: 100 });
  });
});

describe("interactionsEmptyText", () => {
  it("talks about the period when nothing is filtered", () => {
    expect(interactionsEmptyText(DEFAULT_INTERACTIONS_STATE).message).toBe(
      "No interactions in this period",
    );
  });

  it("talks about matching when a search or customer is set", () => {
    expect(
      interactionsEmptyText({ ...DEFAULT_INTERACTIONS_STATE, search: "x" }).message,
    ).toBe("No interactions match");
    expect(
      interactionsEmptyText({ ...DEFAULT_INTERACTIONS_STATE, customerId: 3 }).message,
    ).toBe("No interactions match");
  });

  it("says none yet for all time with no filters", () => {
    expect(
      interactionsEmptyText({ ...DEFAULT_INTERACTIONS_STATE, range: "all" }).message,
    ).toBe("No interactions yet");
  });
});
