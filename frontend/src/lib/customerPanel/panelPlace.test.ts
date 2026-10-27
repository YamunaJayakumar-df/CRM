// Tests for the customer panel's link helpers.
// They protect the main promise of the panel: opening, switching tabs and
// closing it never leaves the current page or loses its filters.
import { describe, expect, it } from "vitest";
import { closePanelLink, customerPanelLink, type PanelPlace } from "./panelPlace";

const interactionsTable: PanelPlace = {
  path: "/interactions",
  keep: { view: "table", range: undefined, q: "R&D" },
};

describe("customerPanelLink", () => {
  it("stays on the page and keeps its filters", () => {
    expect(customerPanelLink(interactionsTable, 12)).toBe(
      "/interactions?view=table&q=R%26D&customer=12",
    );
  });

  it("adds the tab, but leaves out the default overview tab", () => {
    expect(customerPanelLink(interactionsTable, 12, "notes")).toBe(
      "/interactions?view=table&q=R%26D&customer=12&tab=notes",
    );
    expect(customerPanelLink(interactionsTable, 12, "overview")).toBe(
      "/interactions?view=table&q=R%26D&customer=12",
    );
  });

  it("works on a page with no filters", () => {
    expect(customerPanelLink({ path: "/customers", keep: {} }, 3)).toBe("/customers?customer=3");
  });

  it("leaves out blank filters", () => {
    expect(customerPanelLink({ path: "/follow-ups", keep: { q: "  " } }, 3)).toBe(
      "/follow-ups?customer=3",
    );
  });
});

describe("closePanelLink", () => {
  it("keeps the page and its filters, without the panel", () => {
    expect(closePanelLink(interactionsTable)).toBe("/interactions?view=table&q=R%26D");
  });

  it("gives the plain page when there are no filters", () => {
    expect(closePanelLink({ path: "/", keep: {} })).toBe("/");
    expect(closePanelLink({ path: "/customers", keep: { q: undefined } })).toBe("/customers");
  });
});
