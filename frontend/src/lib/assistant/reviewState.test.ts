// Tests for the review screen's logic (no browser, no backend).
// REAL_PLAN is the plan the backend returned for a real note on 2026-10-28:
// "Met Vikram at Orchid Hotels and Resorts, send him a quote by Monday,
//  urgent. Also Kiran from Nova Tech wants a demo next week."
import { describe, expect, it } from "vitest";
import { buildSaveBody, reviewFromPlan, saveProblems, type ReviewState } from "./reviewState";
import type { CustomerChoices, ReviewPlan } from "./types";

const ORCHID_OPTION = {
  id: 39,
  companyName: "Orchid Hotels & Resorts",
  contactName: "Vikram Singh",
  strength: "exactName" as const,
  reasons: ["company name has: orchid, hotels, resorts", "website has: orchid, hotels", "contact name matches: Vikram Singh"],
};

const REAL_PLAN: ReviewPlan = {
  reviewId: "a3f9c2e1-5b7d-4c8e-9f1a-2b3c4d5e6f70",
  customers: [
    {
      understood: {
        companyName: "Orchid Hotels and Resorts",
        contactName: "Vikram",
        phone: null,
        email: null,
        interaction: { type: "MEETING", summary: "Met Vikram at Orchid Hotels and Resorts.", typeWasGuessed: false },
        followUps: [{ title: "Send quote to Vikram at Orchid Hotels and Resorts", dueDate: "2026-11-02", priority: "HIGH" }],
      },
      decision: {
        kind: "preselected",
        selected: ORCHID_OPTION,
        choices: {
          options: [ORCHID_OPTION],
          createNew: { companyName: "Orchid Hotels and Resorts", contactName: "Vikram" },
          moreMatches: false,
        },
      },
    },
    {
      understood: {
        companyName: "Nova Tech",
        contactName: "Kiran",
        phone: null,
        email: null,
        interaction: null,
        followUps: [{ title: "Arrange a demo for Kiran at Nova Tech", dueDate: "2026-11-02", priority: "MEDIUM" }],
      },
      decision: {
        kind: "createNew",
        choices: { options: [], createNew: { companyName: "Nova Tech", contactName: "Kiran" }, moreMatches: false },
      },
    },
  ],
  questions: [],
};

/** Choices with two Greenfield schools (the user must pick). */
const TWO_SCHOOLS: CustomerChoices = {
  options: [
    { id: 35, companyName: "Greenfield Public School", contactName: null, strength: "allWords", reasons: [] },
    { id: 40, companyName: "Greenfield International School", contactName: null, strength: "allWords", reasons: [] },
  ],
  createNew: { companyName: "Greenfield School", contactName: null },
  moreMatches: false,
};

/** The real plan as cards, with one card changed by `change`. */
function realReviewWith(index: number, change: (state: ReviewState) => void): ReviewState {
  const state = reviewFromPlan(REAL_PLAN);
  expect(state.cards[index]).toBeDefined();
  change(state);
  return state;
}

describe("reviewFromPlan", () => {
  it("pre-chooses only the preselected customer and 'create new' when nothing matched", () => {
    const state = reviewFromPlan(REAL_PLAN);
    expect(state.reviewId).toBe(REAL_PLAN.reviewId);
    expect(state.cards.map((card) => card.choice)).toEqual([{ kind: "existing", id: 39 }, { kind: "new" }]);
    expect(state.cards.every((card) => card.included)).toBe(true);
  });

  it("leaves the choice open when the user must choose", () => {
    const state = reviewFromPlan({
      ...REAL_PLAN,
      customers: [{ understood: REAL_PLAN.customers[0]!.understood, decision: { kind: "choose", choices: TWO_SCHOOLS } }],
    });
    expect(state.cards[0]?.choice).toBeNull();
    expect(state.cards[0]?.options).toHaveLength(2);
  });

  it("keeps the question for a customer without a company name", () => {
    const state = reviewFromPlan({
      ...REAL_PLAN,
      customers: [
        {
          understood: { ...REAL_PLAN.customers[1]!.understood, companyName: "" },
          decision: { kind: "needInfo", question: "Which company is Kiran from?", choices: { ...TWO_SCHOOLS, options: [] } },
        },
      ],
    });
    expect(state.cards[0]?.question).toBe("Which company is Kiran from?");
    expect(state.cards[0]?.choice).toBeNull();
  });

  it("fills the new-customer fields from what the AI heard", () => {
    expect(reviewFromPlan(REAL_PLAN).cards[1]?.newCustomer).toEqual({
      companyName: "Nova Tech",
      contactName: "Kiran",
      phone: "",
      email: "",
    });
  });

  it("turns a missing due date into an empty date field", () => {
    const plan: ReviewPlan = {
      ...REAL_PLAN,
      customers: [
        {
          ...REAL_PLAN.customers[1]!,
          understood: { ...REAL_PLAN.customers[1]!.understood, followUps: [{ title: "Call", dueDate: null, priority: "LOW" }] },
        },
      ],
    };
    expect(reviewFromPlan(plan).cards[0]?.followUps[0]?.dueDate).toBe("");
  });
});

describe("saveProblems", () => {
  it("finds nothing wrong with the real plan", () => {
    expect(saveProblems(reviewFromPlan(REAL_PLAN))).toEqual([]);
  });

  it("asks the user to choose a customer", () => {
    const state = realReviewWith(0, (s) => (s.cards[0]!.choice = null));
    expect(saveProblems(state)).toEqual([
      "Customer 1 (Orchid Hotels and Resorts): choose a customer or create a new one.",
    ]);
  });

  it("needs a company name for a new customer", () => {
    const state = realReviewWith(1, (s) => (s.cards[1]!.newCustomer.companyName = "  "));
    expect(saveProblems(state)).toEqual(["Customer 2 (Nova Tech): type the new customer's company name."]);
  });

  it("needs a summary, a follow-up title and a due date", () => {
    const state = realReviewWith(0, (s) => {
      s.cards[0]!.interaction!.summary = "";
      s.cards[0]!.followUps[0]!.title = " ";
      s.cards[0]!.followUps[0]!.dueDate = "";
    });
    expect(saveProblems(state)).toEqual([
      "Customer 1 (Orchid Hotels and Resorts): the meeting needs a summary.",
      "Customer 1 (Orchid Hotels and Resorts), follow-up 1: add a title.",
      "Customer 1 (Orchid Hotels and Resorts), follow-up 1: pick a due date.",
    ]);
  });

  it("refuses an existing customer with nothing to add", () => {
    const state = realReviewWith(0, (s) => {
      s.cards[0]!.interaction = null;
      s.cards[0]!.followUps = [];
    });
    expect(saveProblems(state)).toEqual([
      "Customer 1 (Orchid Hotels and Resorts): nothing to save. Add a follow-up or remove this customer.",
    ]);
  });

  it("ignores problems on a removed customer", () => {
    const state = realReviewWith(0, (s) => {
      s.cards[0]!.choice = null;
      s.cards[0]!.included = false;
    });
    expect(saveProblems(state)).toEqual([]);
  });

  it("needs at least one customer to save", () => {
    const state = realReviewWith(0, (s) => s.cards.forEach((card) => (card.included = false)));
    expect(saveProblems(state)).toEqual(["Nothing to save. Keep at least one customer."]);
  });
});

describe("buildSaveBody", () => {
  it("builds the body the backend expects, each customer with its own actions", () => {
    expect(buildSaveBody(reviewFromPlan(REAL_PLAN))).toEqual({
      reviewId: REAL_PLAN.reviewId,
      customers: [
        {
          customer: { existingId: 39 },
          interaction: { type: "MEETING", summary: "Met Vikram at Orchid Hotels and Resorts." },
          followUps: [{ title: "Send quote to Vikram at Orchid Hotels and Resorts", dueDate: "2026-11-02", priority: "HIGH" }],
        },
        {
          customer: { createNew: { companyName: "Nova Tech", contactName: "Kiran", phone: null, email: null } },
          interaction: null,
          followUps: [{ title: "Arrange a demo for Kiran at Nova Tech", dueDate: "2026-11-02", priority: "MEDIUM" }],
        },
      ],
    });
  });

  it("leaves out removed customers and trims what the user typed", () => {
    const state = realReviewWith(1, (s) => {
      s.cards[0]!.included = false;
      s.cards[1]!.newCustomer = { companyName: "  Nova Tech ", contactName: " ", phone: " 98765 43210 ", email: "" };
      s.cards[1]!.followUps[0]!.title = "  Arrange a demo ";
    });
    expect(buildSaveBody(state).customers).toEqual([
      {
        customer: { createNew: { companyName: "Nova Tech", contactName: null, phone: "98765 43210", email: null } },
        interaction: null,
        followUps: [{ title: "Arrange a demo", dueDate: "2026-11-02", priority: "MEDIUM" }],
      },
    ]);
  });

  it("does not send the AI's typeWasGuessed flag (the backend would refuse unknown fields)", () => {
    const body = buildSaveBody(reviewFromPlan(REAL_PLAN));
    expect(body.customers[0]?.interaction).not.toHaveProperty("typeWasGuessed");
  });
});
