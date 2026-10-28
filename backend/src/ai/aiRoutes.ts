// HTTP routes for the AI assistant.
//
// POST /ai/understand -> read a note and return a REVIEW plan. Saves NOTHING.
//   1. check the note (validateNote)            -> 400 if bad, no AI cost
//   2. ask the AI to fill in the form            -> 503 not set up / 502 AI problem
//   3. check the AI's values (checkUnderstanding) -> problems become questions
//   4. per customer: find, rank and decide        (planNote)
//
// Error messages to the browser stay general; the real reason is logged on
// the server only (never the key: explainError names settings, not values).
//
// NOTE: no login/permission checks yet; they are added in the later Auth step.
// Every request costs money, so this server must stay local until then.
import { Router } from "express";
import { sendBadRequest } from "../shared/httpErrors.js";
import { todayInKolkata } from "../shared/plainDate.js";
import { readAzureConfig, type AzureConfig } from "./azureConfig.js";
import { createAzureClient } from "./azureClient.js";
import { checkUnderstanding } from "./checkUnderstanding.js";
import { planNote, type FindOptions } from "./customerDecision.js";
import { rankCustomerOptions } from "./customerMatching.js";
import { findCustomerCandidates } from "./findCustomerCandidates.js";
import { validateNote } from "./noteValidation.js";
import { explainError } from "./scriptHelpers.js";
import { understandNote } from "./understandNote.js";

export const aiRouter = Router();

/** The real search: fetch candidates from the database, then rank them. */
const findCustomerOptions: FindOptions = async (wanted) => {
  const { candidates, moreMatches } = await findCustomerCandidates(wanted);
  return rankCustomerOptions(wanted, candidates, moreMatches);
};

/** The Azure settings, or null (and a server log line) when they are missing. */
function readConfigOrNull(): AzureConfig | null {
  try {
    return readAzureConfig();
  } catch (error) {
    console.error("AI assistant is not set up:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

aiRouter.post("/understand", async (req, res) => {
  // 1. The note. A missing body or missing "note" field gives "must be text".
  const body: unknown = req.body;
  const rawNote = typeof body === "object" && body !== null ? (body as Record<string, unknown>).note : undefined;
  const note = validateNote(rawNote);
  if (!note.ok) {
    sendBadRequest(res, note.errors);
    return;
  }

  const config = readConfigOrNull();
  if (config === null) {
    res.status(503).json({ error: "The AI assistant is not set up." });
    return;
  }

  // 2. Ask the AI.
  const today = todayInKolkata();
  let outcome;
  try {
    outcome = await understandNote(createAzureClient(config), config.reasoningDeployment, note.data, today);
  } catch (error) {
    console.error("AI request failed:", explainError(error));
    res.status(502).json({ error: "The AI is not available right now. Please try again." });
    return;
  }
  if (!outcome.ok) {
    console.error(`AI answer unusable (${outcome.problem}): ${outcome.detail}`);
    res.status(502).json({ error: "The AI could not read this note. Please write it differently." });
    return;
  }
  if (outcome.tokens) {
    // Cost tracking for the developer (server log only).
    console.log(`AI understand: ${outcome.tokens.input} tokens in, ${outcome.tokens.output} out`);
  }

  // 3 + 4. Check the values, then find and decide each customer.
  const valueQuestions = checkUnderstanding(outcome.understanding, today);
  const plan = await planNote(outcome.understanding, findCustomerOptions);

  res.status(200).json({
    customers: plan.customers,
    // One list, asked together; the same question only once.
    questions: [...new Set([...plan.questions, ...valueQuestions])],
  });
});
