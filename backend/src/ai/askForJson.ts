// askForJson: one AI call that must come back as a filled-in form (JSON).
//
// Every AI "job" (understand a note, summarise a customer, daily briefing)
// does the same four things, so they live here once:
//   1. send our instructions (system) + the job's text (user) + the form
//   2. a refusal         -> { ok:false, problem:"refused" }
//   3. not JSON          -> { ok:false, problem:"notJson" }
//   4. wrong main shape  -> { ok:false, problem:"wrongShape" }
// Each job passes its own `hasShape` check, because we never trust outside
// data, even with Azure's strict mode. (Whether the VALUES make sense is each
// job's own check, e.g. checkUnderstanding.ts.)
//
// Network and key problems are NOT caught here: they are thrown, and the
// caller decides what to tell the user (see explainError in scriptHelpers.ts).
import type { AzureOpenAI } from "openai";
import type { ResponseFormatJSONSchema } from "openai/resources/shared";

export type TokenUsage = { input: number; output: number };

export type AskProblem = "refused" | "notJson" | "wrongShape";

export type AskOutcome<T> =
  | { ok: true; answer: T; tokens: TokenUsage | null }
  /** The AI answered, but not with a usable form. `detail` is for the server log only. */
  | { ok: false; problem: AskProblem; detail: string };

export type JsonRequest<T> = {
  deployment: string;
  instructions: string;
  userText: string;
  format: ResponseFormatJSONSchema;
  hasShape: (value: unknown) => value is T;
};

export async function askForJson<T>(client: AzureOpenAI, request: JsonRequest<T>): Promise<AskOutcome<T>> {
  const response = await client.chat.completions.create({
    model: request.deployment,
    messages: [
      { role: "system", content: request.instructions },
      { role: "user", content: request.userText },
    ],
    response_format: request.format,
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
  if (!request.hasShape(parsed)) {
    return { ok: false, problem: "wrongShape", detail: "The answer did not match the form." };
  }

  const tokens = response.usage
    ? { input: response.usage.prompt_tokens, output: response.usage.completion_tokens }
    : null;
  return { ok: true, answer: parsed, tokens };
}
