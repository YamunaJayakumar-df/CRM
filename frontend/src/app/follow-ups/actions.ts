// Server Actions for the follow-up forms and the one-click status button.
//
// Same rules as app/customers/actions.ts and app/interactions/actions.ts:
// - "use server": these run on the server; the browser only gets a reference
// - nothing from the form is trusted: only known fields are read, ids are
//   checked, returnTo must be a safe internal path, and the backend
//   validates everything again
// - on success: revalidatePath("/", "layout") so every page (and the
//   sidebar / bell counts) shows fresh data, then redirect() (last, never
//   inside try/catch: it works by throwing a special signal)
// After saving or deleting we go back to returnTo, or to /follow-ups.
// (Sign-in checks will be added here once the CRM has logins.)
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { backendSend } from "@/lib/api/backendSend";
import type { FollowUp } from "@/lib/api/types";
import { readCustomerId } from "@/lib/dashboard/customerPanelView";
import {
  createFollowUpBody,
  localFollowUpErrors,
  FOLLOW_UP_FIELD_LABELS,
  readFollowUpFormValues,
  readFollowUpStatus,
  updateFollowUpBody,
  type FollowUpFormState,
  type FollowUpFormValues,
} from "@/lib/followUps/followUpForm";
import { splitFieldErrors } from "@/lib/forms/fieldErrors";
import { safeReturnPath } from "@/lib/forms/safeReturnPath";

const FOLLOW_UP_GONE_MESSAGE = "This follow-up no longer exists";

/** Where to go after a successful save or delete. */
const DEFAULT_RETURN_PATH = "/follow-ups";

/** The state of the Delete form: an error to show, or none. */
export type DeleteFollowUpState = { error: string | null };

/** The form state for a save the backend refused: keep the typing, show the errors. */
function failedState(
  values: FollowUpFormValues,
  error: string,
  details: string[],
): FollowUpFormState {
  const { fieldErrors, formErrors } = splitFieldErrors(details, FOLLOW_UP_FIELD_LABELS);
  const hasAnyMessage = Object.keys(fieldErrors).length > 0 || formErrors.length > 0;
  return { values, fieldErrors, formErrors: hasAnyMessage ? formErrors : [error] };
}

/** The follow-up id from the hidden "followUpId" field, or null if invalid. */
function readFollowUpId(formData: FormData): number | null {
  const raw = formData.get("followUpId");
  // Same digits-only check as customer ids (same database id range).
  return readCustomerId(typeof raw === "string" ? raw : undefined);
}

/** Forget kept pages, then go to the safe returnTo (or the Follow-ups page). */
function finish(formData: FormData): never {
  const returnTo = safeReturnPath(formData.get("returnTo"));
  revalidatePath("/", "layout");
  redirect(returnTo ?? DEFAULT_RETURN_PATH);
}

/** Create a new follow-up (always Open). */
export async function createFollowUp(
  _previousState: FollowUpFormState,
  formData: FormData,
): Promise<FollowUpFormState> {
  const values = readFollowUpFormValues(formData);

  // Checked here so ALL obvious problems show at once; the backend checks again.
  const localErrors = localFollowUpErrors(values, true);
  if (Object.keys(localErrors).length > 0) {
    return { values, fieldErrors: localErrors, formErrors: [] };
  }

  const result = await backendSend<FollowUp>("POST", "/follow-ups", createFollowUpBody(values));
  if (!result.ok) {
    return failedState(values, result.error, result.details);
  }

  finish(formData);
}

/** Save changes to a follow-up (its customer cannot change). */
export async function updateFollowUp(
  _previousState: FollowUpFormState,
  formData: FormData,
): Promise<FollowUpFormState> {
  const values = readFollowUpFormValues(formData);

  const followUpId = readFollowUpId(formData);
  if (followUpId === null) {
    return { values, fieldErrors: {}, formErrors: [FOLLOW_UP_GONE_MESSAGE] };
  }

  const localErrors = localFollowUpErrors(values, false);
  if (Object.keys(localErrors).length > 0) {
    return { values, fieldErrors: localErrors, formErrors: [] };
  }

  const result = await backendSend<FollowUp>(
    "PATCH",
    `/follow-ups/${followUpId}`,
    updateFollowUpBody(values),
  );
  if (!result.ok) {
    if (result.status === 404) {
      return { values, fieldErrors: {}, formErrors: [FOLLOW_UP_GONE_MESSAGE] };
    }
    return failedState(values, result.error, result.details);
  }

  finish(formData);
}

/** Delete a follow-up for good. */
export async function deleteFollowUp(
  _previousState: DeleteFollowUpState,
  formData: FormData,
): Promise<DeleteFollowUpState> {
  const followUpId = readFollowUpId(formData);
  if (followUpId === null) {
    return { error: FOLLOW_UP_GONE_MESSAGE };
  }

  const result = await backendSend<null>("DELETE", `/follow-ups/${followUpId}`);
  if (!result.ok) {
    return { error: result.status === 404 ? FOLLOW_UP_GONE_MESSAGE : result.error };
  }

  finish(formData);
}

/**
 * The one-click "Mark done" / "Reopen" button: changes ONLY the status.
 * Hidden fields: followUpId, status (the NEW status), returnTo.
 * - A bad id or status (someone edited the page) changes nothing.
 * - 404 (someone else deleted it) is not an error worth a message: the
 *   page simply refreshes and the row is gone.
 * - Any other refusal is unexpected for a status-only change, so it is
 *   thrown, and app/error.tsx shows "Try again".
 * Then, like the forms, refresh and go back to returnTo.
 */
export async function setFollowUpStatus(formData: FormData): Promise<void> {
  const followUpId = readFollowUpId(formData);
  const status = readFollowUpStatus(formData.get("status"));

  if (followUpId !== null && status !== null) {
    const result = await backendSend<FollowUp>("PATCH", `/follow-ups/${followUpId}`, { status });
    if (!result.ok && result.status !== 404) {
      throw new Error(`Could not change the follow-up's status: ${result.error}`);
    }
  }

  finish(formData);
}
