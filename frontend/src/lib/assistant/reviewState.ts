// The review screen's logic, kept out of the React components so it can be
// tested without a browser:
//   reviewFromPlan  the AI plan -> editable cards (one per customer)
//   saveProblems    what still stops "Save all" (shown next to the button)
//   buildSaveBody   the cards -> the body of POST /ai/save
//
// Owner rule: nothing is chosen for the user except a "preselected" customer
// (one clear match) or "create new" when nothing matched; the user still
// confirms everything with Save. The backend checks everything again.
import type { FollowUpPriority, InteractionType } from "@/lib/api/types";
import type { CustomerDecision, CustomerOption, ReviewPlan, SaveBody } from "./types";

/** Which customer the user picked on a card, or null while undecided. */
export type CardChoice = { kind: "existing"; id: number } | { kind: "new" } | null;

export type EditableInteraction = { type: InteractionType; summary: string; typeWasGuessed: boolean };

export type EditableFollowUp = { title: string; dueDate: string; priority: FollowUpPriority };

/** The details of a customer to create; empty text means "not given". */
export type NewCustomerFields = { companyName: string; contactName: string; phone: string; email: string };

/** One customer of the note, as the user edits it. */
export type ReviewCard = {
  /** The company name the AI heard ("" if none). */
  heardName: string;
  decisionKind: CustomerDecision["kind"];
  /** The decision layer's question (needInfo only), e.g. "Which company is Ravi from?". */
  question: string | null;
  options: CustomerOption[];
  moreMatches: boolean;
  /** false = the user removed this customer; it is not saved. */
  included: boolean;
  choice: CardChoice;
  newCustomer: NewCustomerFields;
  interaction: EditableInteraction | null;
  followUps: EditableFollowUp[];
};

export type ReviewState = {
  reviewId: string;
  questions: string[];
  cards: ReviewCard[];
};

// Same check as the backend: exactly "YYYY-MM-DD" (the backend also checks the day exists).
const PLAIN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The starting choice for a card (see the owner rule at the top). */
function initialChoice(decision: CustomerDecision): CardChoice {
  if (decision.kind === "preselected") {
    return { kind: "existing", id: decision.selected.id };
  }
  if (decision.kind === "createNew") {
    return { kind: "new" };
  }
  return null; // choose / needInfo: the user decides
}

/** Turn the AI plan into editable review cards. */
export function reviewFromPlan(plan: ReviewPlan): ReviewState {
  return {
    reviewId: plan.reviewId,
    questions: plan.questions,
    cards: plan.customers.map(({ understood, decision }) => ({
      heardName: understood.companyName,
      decisionKind: decision.kind,
      question: decision.kind === "needInfo" ? decision.question : null,
      options: decision.choices.options,
      moreMatches: decision.choices.moreMatches,
      included: true,
      choice: initialChoice(decision),
      newCustomer: {
        companyName: understood.companyName,
        contactName: understood.contactName ?? "",
        phone: understood.phone ?? "",
        email: understood.email ?? "",
      },
      interaction: understood.interaction ? { ...understood.interaction } : null,
      // A missing date becomes "" so the date field starts empty.
      followUps: understood.followUps.map((followUp) => ({ ...followUp, dueDate: followUp.dueDate ?? "" })),
    })),
  };
}

/** How a card is named in messages, e.g. "Customer 2 (Nova Tech)". */
function cardLabel(card: ReviewCard, index: number): string {
  const name = card.heardName.trim();
  return name === "" ? `Customer ${index + 1}` : `Customer ${index + 1} (${name})`;
}

/** Problems that stop one card from being saved. */
function cardProblems(card: ReviewCard, index: number): string[] {
  const label = cardLabel(card, index);
  const problems: string[] = [];

  if (card.choice === null) {
    problems.push(`${label}: choose a customer or create a new one.`);
  } else if (card.choice.kind === "new" && card.newCustomer.companyName.trim() === "") {
    problems.push(`${label}: type the new customer's company name.`);
  }

  if (card.interaction !== null && card.interaction.summary.trim() === "") {
    problems.push(`${label}: the ${card.interaction.type.toLowerCase()} needs a summary.`);
  }

  card.followUps.forEach((followUp, followUpIndex) => {
    const name = `${label}, follow-up ${followUpIndex + 1}`;
    if (followUp.title.trim() === "") {
      problems.push(`${name}: add a title.`);
    }
    if (!PLAIN_DATE_PATTERN.test(followUp.dueDate)) {
      problems.push(`${name}: pick a due date.`);
    }
  });

  if (card.choice?.kind === "existing" && card.interaction === null && card.followUps.length === 0) {
    problems.push(`${label}: nothing to save. Add a follow-up or remove this customer.`);
  }
  return problems;
}

/** Everything that still stops "Save all". Empty means ready to save. */
export function saveProblems(state: ReviewState): string[] {
  const included = state.cards.filter((card) => card.included);
  if (included.length === 0) {
    return ["Nothing to save. Keep at least one customer."];
  }
  return state.cards.flatMap((card, index) => (card.included ? cardProblems(card, index) : []));
}

/** "" -> null, other text trimmed (for optional customer fields). */
function textOrNull(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * The body of POST /ai/save. Only call when saveProblems(state) is empty;
 * undecided cards are skipped as a safety net (the backend would refuse them).
 */
export function buildSaveBody(state: ReviewState): SaveBody {
  const customers: SaveBody["customers"] = [];
  for (const card of state.cards) {
    if (!card.included || card.choice === null) {
      continue;
    }
    customers.push({
      customer:
        card.choice.kind === "existing"
          ? { existingId: card.choice.id }
          : {
              createNew: {
                companyName: card.newCustomer.companyName.trim(),
                contactName: textOrNull(card.newCustomer.contactName),
                phone: textOrNull(card.newCustomer.phone),
                email: textOrNull(card.newCustomer.email),
              },
            },
      interaction: card.interaction ? { type: card.interaction.type, summary: card.interaction.summary.trim() } : null,
      followUps: card.followUps.map((followUp) => ({
        title: followUp.title.trim(),
        dueDate: followUp.dueDate,
        priority: followUp.priority,
      })),
    });
  }
  return { reviewId: state.reviewId, customers };
}
