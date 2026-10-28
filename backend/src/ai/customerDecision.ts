// Decides what the review screen does with each customer the AI heard:
// pre-select one, let the user choose, offer "create new", or ask a question.
//
// Owner rules (docs/ai-assistant-flow.md, "Decisions"):
//   - a clear, unique match is only PRE-SELECTED; the user still confirms
//     the whole review and can change it;
//   - "clear, unique" = exactly one exactName option, no other exactName or
//     allWords option, and moreMatches false. No confidence percentages.
//
// Pure logic: the database search is passed in as `findOptions`, so this
// file never touches the database and is easy to test.
import { nameWords, type CustomerChoices, type CustomerOption, type NameToMatch } from "./customerMatching.js";
import type { NoteUnderstanding, UnderstoodCustomer } from "./understandingSchema.js";

export type CustomerDecision =
  /** One clear match, ticked on the review. Other options stay visible. */
  | { kind: "preselected"; selected: CustomerOption; choices: CustomerChoices }
  /** Several possible customers (or more than we fetched): the user picks. */
  | { kind: "choose"; choices: CustomerChoices }
  /** No customer matches: offer to create one. */
  | { kind: "createNew"; choices: CustomerChoices }
  /** The company is not named: ask, and show any contact-name matches. */
  | { kind: "needInfo"; question: string; choices: CustomerChoices };

/** One customer from the note, its decision, and ITS interaction and follow-ups. */
export type PlannedCustomer = {
  understood: UnderstoodCustomer;
  decision: CustomerDecision;
};

export type NotePlan = {
  customers: PlannedCustomer[];
  /** Every question for the user, asked together on one screen. */
  questions: string[];
};

/** Finds and ranks the options for a name (the real one uses the database). */
export type FindOptions = (wanted: NameToMatch) => Promise<CustomerChoices>;

/** Strengths that make another option a real alternative to an exact match. */
const STRONG_STRENGTHS = new Set(["exactName", "allWords"]);

/**
 * The single clear match, or null. Owner rule B: exactly one exactName option,
 * no other exactName/allWords option, and nothing left out (moreMatches false).
 */
export function findClearUniqueMatch(choices: CustomerChoices): CustomerOption | null {
  if (choices.moreMatches) {
    return null;
  }
  const exact = choices.options.filter((option) => option.strength === "exactName");
  const strong = choices.options.filter((option) => STRONG_STRENGTHS.has(option.strength));
  return exact.length === 1 && strong.length === 1 ? (exact[0] ?? null) : null;
}

/** The question to ask when the note does not name the company. */
function whichCompanyQuestion(contactName: string | null): string {
  return contactName ? `Which company is ${contactName} from?` : "Which company is this about?";
}

/** Decide for ONE customer, given its ranked options. */
export function decideCustomer(understood: UnderstoodCustomer, choices: CustomerChoices): CustomerDecision {
  // Empty or only filler words ("Pvt Ltd"): there is no company name to match.
  if (nameWords(understood.companyName).length === 0) {
    return { kind: "needInfo", question: whichCompanyQuestion(understood.contactName), choices };
  }
  const clear = findClearUniqueMatch(choices);
  if (clear !== null) {
    return { kind: "preselected", selected: clear, choices };
  }
  if (choices.options.length > 0) {
    return { kind: "choose", choices };
  }
  return { kind: "createNew", choices };
}

/**
 * Plan the review for a whole note: one decision PER customer, each keeping
 * its own interaction and follow-ups (customers are never merged), and all
 * questions collected into one list.
 */
export async function planNote(understanding: NoteUnderstanding, findOptions: FindOptions): Promise<NotePlan> {
  const customers: PlannedCustomer[] = [];
  for (const understood of understanding.customers) {
    const choices = await findOptions({
      companyName: understood.companyName,
      contactName: understood.contactName,
    });
    customers.push({ understood, decision: decideCustomer(understood, choices) });
  }

  const questions = [...understanding.unclear];
  for (const { decision } of customers) {
    if (decision.kind === "needInfo") {
      questions.push(decision.question);
    }
  }
  // The same question twice (from the AI and from us) is asked only once.
  return { customers, questions: [...new Set(questions)] };
}
