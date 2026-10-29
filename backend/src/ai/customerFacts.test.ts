// Tests for the customer facts sheet.
// The database is NOT used: vi.mock replaces db.ts with a fake `prisma`.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../db.js";
import {
  customerFactsText,
  loadCustomerFacts,
  MAX_DONE_FOLLOW_UPS,
  MAX_INTERACTIONS,
  MAX_OPEN_FOLLOW_UPS,
  shorten,
  type CustomerFacts,
} from "./customerFacts.js";

vi.mock("../db.js", () => ({
  prisma: { customer: { findUnique: vi.fn() }, followUp: { findMany: vi.fn() } },
}));

const findUnique = vi.mocked(prisma.customer.findUnique);
const findMany = vi.mocked(prisma.followUp.findMany);

beforeEach(() => {
  findUnique.mockReset();
  findMany.mockReset();
});

const TODAY = "2026-10-29";

function facts(overrides: Partial<CustomerFacts> = {}): CustomerFacts {
  return {
    customer: {
      companyName: "Sunrise Multispeciality Hospital",
      contactName: "Ravi",
      website: "sunrisehospital.example",
      industry: null,
      status: "ACTIVE",
      notes: "",
    },
    // 2026-10-28T05:30Z is 11:00 on Oct 28 in India.
    interactions: [{ type: "CALL", summary: "Asked about  the backup\nproblem.", occurredAt: new Date("2026-10-28T05:30:00Z") }],
    interactionTotal: 1,
    openFollowUps: [
      { title: "Send quote", dueDate: new Date("2026-10-25T00:00:00Z"), priority: "HIGH", notes: "Two servers" },
      { title: "Call Ravi", dueDate: new Date("2026-10-29T00:00:00Z"), priority: "MEDIUM", notes: null },
      { title: "Site visit", dueDate: new Date("2026-11-02T00:00:00Z"), priority: "LOW", notes: null },
    ],
    doneFollowUps: [{ title: "Send SLA copy", dueDate: new Date("2026-10-21T00:00:00Z"), priority: "LOW", notes: null }],
    ...overrides,
  };
}

describe("customerFactsText", () => {
  it("writes the customer, interactions and follow-ups as plain text", () => {
    expect(customerFactsText(facts(), TODAY)).toBe(
      [
        "Today: 2026-10-29",
        "",
        "CUSTOMER",
        "Company: Sunrise Multispeciality Hospital",
        "Contact person: Ravi",
        "Industry: not recorded",
        "Website: sunrisehospital.example",
        "Status: ACTIVE",
        "Customer notes: not recorded",
        "",
        "INTERACTIONS (newest first)",
        "- 2026-10-28 CALL: Asked about the backup problem.",
        "",
        "OPEN FOLLOW-UPS (soonest first)",
        "- due 2026-10-25 (OVERDUE by 4 days), HIGH priority: Send quote. Notes: Two servers",
        "- due 2026-10-29 (due TODAY), MEDIUM priority: Call Ravi.",
        "- due 2026-11-02, LOW priority: Site visit.",
        "",
        "RECENTLY COMPLETED FOLLOW-UPS",
        "- was due 2026-10-21, LOW priority: Send SLA copy.",
      ].join("\n"),
    );
  });

  it("says when only the latest interactions are shown", () => {
    expect(customerFactsText(facts({ interactionTotal: 34 }), TODAY)).toContain(
      "INTERACTIONS (newest first, latest 1 of 34)",
    );
  });

  it("says 'none' for empty lists, so the AI does not guess", () => {
    const text = customerFactsText(facts({ interactions: [], interactionTotal: 0, openFollowUps: [], doneFollowUps: [] }), TODAY);
    expect(text).toContain("INTERACTIONS (newest first)\n- none recorded");
    expect(text).toContain("OPEN FOLLOW-UPS (soonest first)\n- none");
    expect(text).toContain("RECENTLY COMPLETED FOLLOW-UPS\n- none");
  });

  it("uses the India day for an interaction late in the UTC evening", () => {
    // 19:00 UTC on Oct 27 is 00:30 on Oct 28 in India.
    const late = facts({ interactions: [{ type: "NOTE", summary: "Late note", occurredAt: new Date("2026-10-27T19:00:00Z") }] });
    expect(customerFactsText(late, TODAY)).toContain("- 2026-10-28 NOTE: Late note");
  });

  it("says '1 day' for one day overdue", () => {
    const one = facts({ openFollowUps: [{ title: "X", dueDate: new Date("2026-10-28T00:00:00Z"), priority: "LOW", notes: null }] });
    expect(customerFactsText(one, TODAY)).toContain("(OVERDUE by 1 day)");
  });
});

describe("shorten", () => {
  it("keeps short text and squeezes spaces", () => {
    expect(shorten("  a \n b ")).toBe("a b");
  });

  it("cuts long text with an ellipsis", () => {
    expect(shorten("abcdefghij", 5)).toBe("abcd…");
  });
});

describe("loadCustomerFacts", () => {
  it("returns null when the customer does not exist (and reads nothing else)", async () => {
    findUnique.mockResolvedValue(null);
    expect(await loadCustomerFacts(99)).toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("reads the customer without email or phone, with limits", async () => {
    findUnique.mockResolvedValue({
      companyName: "A",
      contactName: null,
      website: null,
      industry: null,
      status: "ACTIVE",
      notes: null,
      interactions: [],
      _count: { interactions: 0 },
    } as never);
    findMany.mockResolvedValue([]);

    const result = await loadCustomerFacts(12);

    const query = findUnique.mock.calls[0]?.[0];
    expect(query?.where).toEqual({ id: 12 });
    expect(query?.select).not.toHaveProperty("email");
    expect(query?.select).not.toHaveProperty("phone");
    expect(query?.select?.interactions).toMatchObject({ orderBy: { occurredAt: "desc" }, take: MAX_INTERACTIONS });

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({ where: { customerId: 12, status: "OPEN" }, take: MAX_OPEN_FOLLOW_UPS });
    expect(findMany.mock.calls[1]?.[0]).toMatchObject({ where: { customerId: 12, status: "DONE" }, take: MAX_DONE_FOLLOW_UPS });

    expect(result).toEqual({
      customer: { companyName: "A", contactName: null, website: null, industry: null, status: "ACTIVE", notes: null },
      interactions: [],
      interactionTotal: 0,
      openFollowUps: [],
      doneFollowUps: [],
    });
  });
});
