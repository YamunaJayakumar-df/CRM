// Asks the AI to fill in the form (understandingSchema.ts) for one note.
//
// Used by the POST /ai/understand endpoint and the lesson script
// (npm run ai:understand). The `client` is passed in, so tests can pass a
// FAKE client that answers instantly and costs nothing.
// The call itself (refusal / not JSON / wrong shape) is askForJson.ts,
// shared with the other AI jobs.
import type { AzureOpenAI } from "openai";
import { askForJson, type AskProblem, type TokenUsage } from "./askForJson.js";
import { buildAssistantInstructions } from "./assistantInstructions.js";
import { NOTE_UNDERSTANDING_FORMAT, type NoteUnderstanding } from "./understandingSchema.js";

export type UnderstandOutcome =
  | { ok: true; understanding: NoteUnderstanding; tokens: TokenUsage | null }
  /** The AI answered, but not with a usable form. `detail` is for the server log only. */
  | { ok: false; problem: AskProblem; detail: string };

/**
 * A light check that the parsed answer has the form's main shape.
 * Azure's strict mode should guarantee it, but we never trust outside data.
 * (Whether the VALUES make sense is checked in checkUnderstanding.ts.)
 */
function hasUnderstandingShape(value: unknown): value is NoteUnderstanding {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const answer = value as Record<string, unknown>;
  return (
    Array.isArray(answer.customers) &&
    answer.customers.every(
      (customer) =>
        typeof customer === "object" &&
        customer !== null &&
        typeof (customer as Record<string, unknown>).companyName === "string" &&
        Array.isArray((customer as Record<string, unknown>).followUps),
    ) &&
    Array.isArray(answer.unclear) &&
    answer.unclear.every((question) => typeof question === "string")
  );
}

/**
 * Send one (already validated) note with our instructions and the form.
 * `today` is today's date in India ("YYYY-MM-DD"), see todayInKolkata().
 */
export async function understandNote(
  client: AzureOpenAI,
  deployment: string,
  note: string,
  today: string,
): Promise<UnderstandOutcome> {
  const outcome = await askForJson(client, {
    deployment,
    instructions: buildAssistantInstructions(today),
    userText: note,
    format: NOTE_UNDERSTANDING_FORMAT,
    hasShape: hasUnderstandingShape,
  });
  if (!outcome.ok) {
    return outcome;
  }
  return { ok: true, understanding: outcome.answer, tokens: outcome.tokens };
}
