// Asks the AI to fill in the form (understandingSchema.ts) for one note.
//
// Used by the POST /ai/understand endpoint and the lesson script
// (npm run ai:understand). The `client` is passed in, so tests can pass a
// FAKE client that answers instantly and costs nothing.
//
// Network and key problems are NOT caught here: they are thrown, and the
// caller decides what to tell the user (see explainError in scriptHelpers.ts).
import type { AzureOpenAI } from "openai";
import { buildAssistantInstructions } from "./assistantInstructions.js";
import { NOTE_UNDERSTANDING_FORMAT, type NoteUnderstanding } from "./understandingSchema.js";

export type TokenUsage = { input: number; output: number };

export type UnderstandOutcome =
  | { ok: true; understanding: NoteUnderstanding; tokens: TokenUsage | null }
  /** The AI answered, but not with a usable form. `detail` is for the server log only. */
  | { ok: false; problem: "refused" | "notJson" | "wrongShape"; detail: string };

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
  const response = await client.chat.completions.create({
    model: deployment,
    messages: [
      { role: "system", content: buildAssistantInstructions(today) },
      { role: "user", content: note },
    ],
    response_format: NOTE_UNDERSTANDING_FORMAT,
  });

  const message = response.choices[0]?.message;
  if (message?.refusal) {
    return { ok: false, problem: "refused", detail: message.refusal };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(message?.content ?? "");
  } catch {
    return { ok: false, problem: "notJson", detail: "The answer was not valid JSON." };
  }
  if (!hasUnderstandingShape(parsed)) {
    return { ok: false, problem: "wrongShape", detail: "The answer did not match the form." };
  }

  const tokens = response.usage
    ? { input: response.usage.prompt_tokens, output: response.usage.completion_tokens }
    : null;
  return { ok: true, understanding: parsed, tokens };
}
