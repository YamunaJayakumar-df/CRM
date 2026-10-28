// Checks that the VALUES in the AI's answer make sense for the CRM.
//
// The form (understandingSchema.ts) guarantees the SHAPE, but the AI can still
// write a date that does not exist, a date in the past, or a title that is too
// long. We reuse the CRM's own validators, so AI data follows exactly the same
// rules as data typed into the forms.
//
// Problems do NOT reject the note: each one becomes a question for the user,
// who fixes it on the review screen. Saving checks everything again (Step 5).
import { validateCreateCustomer } from "../customers/customerValidation.js";
import { validateUpdateFollowUp } from "../followUps/followUpValidation.js";
import { validateUpdateInteraction } from "../interactions/interactionValidation.js";
import { nameWords } from "./customerMatching.js";
import type { NoteUnderstanding, UnderstoodCustomer } from "./understandingSchema.js";

/** How a customer is named in questions: its company, or a fallback. */
function customerLabel(customer: UnderstoodCustomer): string {
  return customer.companyName.trim() !== "" ? customer.companyName.trim() : "the unnamed customer";
}

/** Questions about one customer's details, interaction and follow-ups. */
function checkCustomer(customer: UnderstoodCustomer, today: string): string[] {
  const label = customerLabel(customer);
  const questions: string[] = [];

  // A missing company is asked about by the decision layer ("Which company...?").
  if (nameWords(customer.companyName).length > 0) {
    const details = validateCreateCustomer({
      companyName: customer.companyName,
      contactName: customer.contactName,
      phone: customer.phone,
      email: customer.email,
    });
    if (!details.ok) {
      questions.push(...details.errors.map((error) => `${label}: ${error}.`));
    }
  }

  if (customer.interaction !== null) {
    // The "update" validators check values without needing a customer id yet.
    const interaction = validateUpdateInteraction({
      type: customer.interaction.type,
      summary: customer.interaction.summary,
    });
    if (!interaction.ok) {
      questions.push(...interaction.errors.map((error) => `Interaction for ${label}: ${error}.`));
    }
  }

  for (const followUp of customer.followUps) {
    const name = `Follow-up "${followUp.title}" for ${label}`;
    if (followUp.dueDate === null) {
      questions.push(`${name}: when is it due?`);
      continue;
    }
    const checked = validateUpdateFollowUp({
      title: followUp.title,
      dueDate: followUp.dueDate,
      priority: followUp.priority,
    });
    if (!checked.ok) {
      questions.push(...checked.errors.map((error) => `${name}: ${error}.`));
      continue;
    }
    // Plain dates "YYYY-MM-DD" compare correctly as text.
    // (The CRM forms allow past dates on purpose, for editing old follow-ups,
    // so this check is only for AI answers.)
    if (followUp.dueDate < today) {
      questions.push(`${name}: the due date ${followUp.dueDate} is in the past. Please pick a date.`);
    }
  }
  return questions;
}

/** Every problem in the AI's answer, as questions for the user. Empty means all fine. */
export function checkUnderstanding(understanding: NoteUnderstanding, today: string): string[] {
  return understanding.customers.flatMap((customer) => checkCustomer(customer, today));
}
