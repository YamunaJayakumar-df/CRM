// Tests for the decision layer (pure logic: no database, no AI).
// Options are made with the REAL rankCustomerOptions from fake customers,
// so ranking and deciding are checked together.
import { describe, expect, it } from "vitest";
import { decideCustomer, findClearUniqueMatch, planNote, type FindOptions } from "./customerDecision.js";
import { rankCustomerOptions, type CustomerCandidate, type NameToMatch } from "./customerMatching.js";
import type { NoteUnderstanding, UnderstoodCustomer } from "./understandingSchema.js";

const ORCHID: CustomerCandidate = { id: 1, companyName: "Orchid Hotels & Resorts", contactName: "Vikram Singh", website: null };
const GREENFIELD_PUBLIC: CustomerCandidate = { id: 2, companyName: "Greenfield Public School", contactName: "Arjun Mehta", website: null };
const GREENFIELD_INTERNATIONAL: CustomerCandidate = { id: 3, companyName: "Greenfield International School", contactName: "Meera Iyer", website: null };
const LOTUS_BANK: CustomerCandidate = { id: 4, companyName: "Lotus Cooperative Bank", contactName: "Arjun Rao", website: null };
const SUNRISE: CustomerCandidate = { id: 5, companyName: "Sunrise Multispeciality Hospital", contactName: "Priya Raman", website: null };

const ALL = [ORCHID, GREENFIELD_PUBLIC, GREENFIELD_INTERNATIONAL, LOTUS_BANK, SUNRISE];

/** A customer as the AI might hear it, with no interaction or follow-ups unless given. */
function heard(companyName: string, contactName: string | null = null, extra: Partial<UnderstoodCustomer> = {}): UnderstoodCustomer {
  return { companyName, contactName, phone: null, email: null, interaction: null, followUps: [], ...extra };
}

/** Rank the fake customers for what the AI heard, like the real search would. */
function choicesFor(customer: UnderstoodCustomer, candidates = ALL, moreMatches = false) {
  return rankCustomerOptions(customer, candidates, moreMatches);
}

/** A fake findOptions over the fake customers (instead of the database). */
const fakeFindOptions: FindOptions = async (wanted: NameToMatch) => rankCustomerOptions(wanted, ALL);

describe("decideCustomer", () => {
  it("1. pre-selects one exact, unique company match", () => {
    const customer = heard("Orchid Hotels and Resorts Pvt Ltd");
    const decision = decideCustomer(customer, choicesFor(customer));
    expect(decision.kind).toBe("preselected");
    expect(decision.kind === "preselected" && decision.selected.id).toBe(ORCHID.id);
  });

  it("1b. still keeps the other options and 'create new' when pre-selecting", () => {
    const customer = heard("Orchid Hotels and Resorts", "Arjun"); // Arjun also matches 2 others
    const decision = decideCustomer(customer, choicesFor(customer));
    expect(decision.kind).toBe("preselected");
    expect(decision.choices.options.map((option) => option.id)).toEqual([ORCHID.id, GREENFIELD_PUBLIC.id, LOTUS_BANK.id]);
    expect(decision.choices.createNew.companyName).toBe("Orchid Hotels and Resorts");
  });

  it("2. lets the user choose between two similar names", () => {
    const customer = heard("Greenfield School");
    const decision = decideCustomer(customer, choicesFor(customer));
    expect(decision.kind).toBe("choose");
    expect(decision.choices.options).toHaveLength(2);
  });

  it("2b. lets the user choose when the only match is partial (allWords is not proof)", () => {
    const customer = heard("Sunrise Hospital");
    expect(decideCustomer(customer, choicesFor(customer)).kind).toBe("choose");
  });

  it("2c. lets the user choose between two customers with the identical name", () => {
    const twin: CustomerCandidate = { ...ORCHID, id: 99, contactName: "Someone Else" };
    const customer = heard("Orchid Hotels & Resorts");
    const decision = decideCustomer(customer, choicesFor(customer, [ORCHID, twin]));
    expect(decision.kind).toBe("choose");
  });

  it("2d. lets the user choose when an exact match has a strong rival", () => {
    const rival: CustomerCandidate = { id: 98, companyName: "Orchid Hotels & Resorts Goa", contactName: null, website: null };
    const customer = heard("Orchid Hotels & Resorts");
    expect(decideCustomer(customer, choicesFor(customer, [ORCHID, rival])).kind).toBe("choose");
  });

  it("3. lets the user choose when several customers share the contact name", () => {
    const customer = heard("Nova Tech", "Arjun");
    const decision = decideCustomer(customer, choicesFor(customer));
    expect(decision.kind).toBe("choose");
    expect(decision.choices.options.map((option) => option.id)).toEqual([GREENFIELD_PUBLIC.id, LOTUS_BANK.id]);
  });

  it("4. offers to create a new customer when nothing matches", () => {
    const customer = heard("Nova Tech", "Kiran");
    const decision = decideCustomer(customer, choicesFor(customer));
    expect(decision).toEqual({
      kind: "createNew",
      choices: { options: [], createNew: { companyName: "Nova Tech", contactName: "Kiran" }, moreMatches: false },
    });
  });

  it("5. never pre-selects when the list is incomplete (moreMatches), even for an exact match", () => {
    const customer = heard("Orchid Hotels & Resorts");
    const decision = decideCustomer(customer, choicesFor(customer, ALL, true));
    expect(decision.kind).toBe("choose");
    expect(decision.choices.moreMatches).toBe(true);
  });

  it("6. asks which company when the company name is missing", () => {
    const customer = heard("", "Priya");
    const decision = decideCustomer(customer, choicesFor(customer));
    expect(decision.kind).toBe("needInfo");
    expect(decision.kind === "needInfo" && decision.question).toBe("Which company is Priya from?");
    expect(decision.choices.options.map((option) => option.id)).toEqual([SUNRISE.id]); // contact match shown
  });

  it("6b. treats a name of only filler words as missing", () => {
    const customer = heard("Pvt Ltd");
    const decision = decideCustomer(customer, choicesFor(customer));
    expect(decision.kind === "needInfo" && decision.question).toBe("Which company is this about?");
  });

  it("6c. works without a contact name", () => {
    const customer = heard("Lotus Cooperative Bank", null);
    expect(decideCustomer(customer, choicesFor(customer)).kind).toBe("preselected");
  });
});

describe("findClearUniqueMatch", () => {
  it("returns null when there are no options", () => {
    expect(findClearUniqueMatch({ options: [], createNew: { companyName: "X", contactName: null }, moreMatches: false })).toBeNull();
  });
});

describe("planNote", () => {
  it("7. keeps each customer with its own interaction and follow-ups", async () => {
    const understanding: NoteUnderstanding = {
      customers: [
        heard("Sunrise Hospital", "Priya", {
          interaction: { type: "CALL", summary: "Talked to Priya.", typeWasGuessed: true },
          followUps: [{ title: "Call Priya", dueDate: "2026-10-30", priority: "MEDIUM" }],
        }),
        heard("Orchid Hotels and Resorts", "Vikram", {
          followUps: [{ title: "Send quote", dueDate: "2026-11-02", priority: "HIGH" }],
        }),
      ],
      unclear: [],
    };
    const plan = await planNote(understanding, fakeFindOptions);

    expect(plan.customers).toHaveLength(2);
    const [sunrise, orchid] = plan.customers;
    expect(sunrise?.understood.followUps[0]?.title).toBe("Call Priya");
    expect(sunrise?.understood.interaction?.type).toBe("CALL");
    expect(sunrise?.decision.kind).toBe("choose");
    expect(orchid?.understood.followUps[0]?.title).toBe("Send quote");
    expect(orchid?.understood.interaction).toBeNull();
    expect(orchid?.decision.kind).toBe("preselected");
    expect(plan.questions).toEqual([]);
  });

  it("collects the AI's questions and ours into one list, without repeats", async () => {
    const understanding: NoteUnderstanding = {
      customers: [heard("", "Ravi"), heard("", null)],
      unclear: ["Which company is Ravi from?", "What is the proposal about?"],
    };
    const plan = await planNote(understanding, fakeFindOptions);
    expect(plan.questions).toEqual([
      "Which company is Ravi from?",
      "What is the proposal about?",
      "Which company is this about?",
    ]);
  });

  it("returns an empty plan when the AI found no customers", async () => {
    const plan = await planNote({ customers: [], unclear: ["Which customer?"] }, fakeFindOptions);
    expect(plan).toEqual({ customers: [], questions: ["Which customer?"] });
  });
});
