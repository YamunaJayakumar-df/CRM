// TypeScript shapes of the AI assistant's JSON (POST /ai/understand, /ai/save).
// Keep in sync with backend/src/ai/ (understandingSchema.ts,
// customerMatching.ts, customerDecision.ts, saveValidation.ts, saveReview.ts).
import type { FollowUpPriority, InteractionType } from "@/lib/api/types";

/** How well a customer option matches what the AI heard, best first. */
export type MatchStrength = "exactName" | "allWords" | "someWords" | "contactOnly";

export type CustomerOption = {
  id: number;
  companyName: string;
  contactName: string | null;
  strength: MatchStrength;
  /** Plain-English reasons, e.g. "company name has: sunrise, hospital". */
  reasons: string[];
};

export type CustomerChoices = {
  options: CustomerOption[];
  createNew: { companyName: string; contactName: string | null };
  moreMatches: boolean;
};

export type CustomerDecision =
  | { kind: "preselected"; selected: CustomerOption; choices: CustomerChoices }
  | { kind: "choose"; choices: CustomerChoices }
  | { kind: "createNew"; choices: CustomerChoices }
  | { kind: "needInfo"; question: string; choices: CustomerChoices };

export type UnderstoodCustomer = {
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  interaction: { type: InteractionType; summary: string; typeWasGuessed: boolean } | null;
  followUps: { title: string; dueDate: string | null; priority: FollowUpPriority }[];
};

/** The answer of POST /ai/understand: the plan for the review screen. */
export type ReviewPlan = {
  /** The "ticket number" sent back with Save. */
  reviewId: string;
  customers: { understood: UnderstoodCustomer; decision: CustomerDecision }[];
  questions: string[];
};

/** The body of POST /ai/save. */
export type SaveBody = {
  reviewId: string;
  customers: {
    customer:
      | { existingId: number }
      | { createNew: { companyName: string; contactName: string | null; phone: string | null; email: string | null } };
    interaction: { type: InteractionType; summary: string } | null;
    followUps: { title: string; dueDate: string; priority: FollowUpPriority }[];
  }[];
};

/** The answer of POST /ai/save: what was created for each customer. */
export type SaveResult = {
  alreadySaved: boolean;
  items: { customerId: number; customerCreated: boolean; interactionId: number | null; followUpIds: number[] }[];
};
