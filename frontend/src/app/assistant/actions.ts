// Server Actions for the AI Assistant page.
//
// Same rules as the other actions.ts files:
// - "use server": these run on the server; the browser only gets a reference,
//   so the backend address never reaches the browser
// - nothing from the browser is trusted: the backend checks the note and the
//   whole save again (backend/src/ai/saveValidation.ts)
// Different from the forms: they RETURN a result instead of redirecting,
// because the page stays open (note -> review cards -> "Saved").
// Unexpected problems (backend offline, timeout) also become a calm message,
// so the user keeps their note and can simply try again.
// (Sign-in checks will be added here once the CRM has logins.)
"use server";

import { revalidatePath } from "next/cache";
import { backendSend } from "@/lib/api/backendSend";
import type { ReviewPlan, SaveBody, SaveResult } from "@/lib/assistant/types";

// The AI can take a while (Azure answers in about 5-20 seconds).
const UNDERSTAND_TIMEOUT_MS = 60_000;
const SAVE_TIMEOUT_MS = 30_000;

// The backend's "AI not set up" (503) and "AI not available" (502) answers
// are shown on the page instead of the error page.
const AI_PROBLEM_STATUSES = [502, 503];

const UNREACHABLE_MESSAGE = "The CRM server did not answer. Please check it is running and try again.";

export type ActionFailure = { ok: false; message: string; details: string[] };

export type UnderstandResult = { ok: true; plan: ReviewPlan } | ActionFailure;

export type SaveReviewResult = { ok: true; result: SaveResult } | ActionFailure;

/** Ask the backend what a note means. Saves nothing. */
export async function understandNoteAction(note: unknown): Promise<UnderstandResult> {
  if (typeof note !== "string") {
    return { ok: false, message: "The note must be text.", details: [] };
  }
  try {
    const result = await backendSend<ReviewPlan>("POST", "/ai/understand", { note }, {
      timeoutMs: UNDERSTAND_TIMEOUT_MS,
      extraExpectedStatuses: AI_PROBLEM_STATUSES,
    });
    if (!result.ok) {
      return { ok: false, message: result.error, details: result.details };
    }
    if (result.data === null) {
      return { ok: false, message: "The AI assistant sent an empty answer. Please try again.", details: [] };
    }
    return { ok: true, plan: result.data };
  } catch (error) {
    console.error("AI understand failed:", error instanceof Error ? error.message : String(error));
    return { ok: false, message: UNREACHABLE_MESSAGE, details: [] };
  }
}

/** Save the review the user confirmed. Safe to repeat: the same review is saved once. */
export async function saveReviewAction(body: SaveBody): Promise<SaveReviewResult> {
  try {
    const result = await backendSend<SaveResult>("POST", "/ai/save", body, { timeoutMs: SAVE_TIMEOUT_MS });
    if (!result.ok) {
      return { ok: false, message: result.error, details: result.details };
    }
    if (result.data === null) {
      return { ok: false, message: "The save gave an empty answer. Please check the customer pages.", details: [] };
    }
    // New interactions and follow-ups: every page (dashboard, lists) must show them.
    revalidatePath("/", "layout");
    return { ok: true, result: result.data };
  } catch (error) {
    console.error("AI save failed:", error instanceof Error ? error.message : String(error));
    return { ok: false, message: UNREACHABLE_MESSAGE, details: [] };
  }
}
