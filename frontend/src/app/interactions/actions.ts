// Server Actions for the Log / Edit / Delete interaction forms.
//
// Same rules as app/customers/actions.ts (read that file's notes first):
// - "use server": these run on the server; the browser only gets a reference
// - nothing from the form is trusted: only known fields are read, ids are
//   checked, returnTo must be a safe internal path, and the backend
//   validates everything again
// - on success: revalidatePath("/", "layout") so every page shows fresh
//   data, then redirect() (last, never inside try/catch: it works by
//   throwing a special signal)
// After saving or deleting we go back to returnTo, or to /interactions.
// (Sign-in checks will be added here once the CRM has logins.)
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { backendSend } from "@/lib/api/backendSend";
import type { Interaction } from "@/lib/api/types";
import { readCustomerId } from "@/lib/dashboard/customerPanelView";
import { splitFieldErrors } from "@/lib/forms/fieldErrors";
import { safeReturnPath } from "@/lib/forms/safeReturnPath";
import {
  createInteractionBody,
  INTERACTION_FIELD_LABELS,
  kolkataInputsToIso,
  readInteractionFormValues,
  updateInteractionBody,
  type InteractionFormState,
  type InteractionFormValues,
} from "@/lib/interactions/interactionForm";

const INTERACTION_GONE_MESSAGE = "This interaction no longer exists";

/** Where to go after a successful save or delete. */
const DEFAULT_RETURN_PATH = "/interactions";

/** The state of the Delete form: an error to show, or none. */
export type DeleteInteractionState = { error: string | null };

/** The form state for a save the backend refused: keep the typing, show the errors. */
function failedState(
  values: InteractionFormValues,
  error: string,
  details: string[],
): InteractionFormState {
  const { fieldErrors, formErrors } = splitFieldErrors(details, INTERACTION_FIELD_LABELS);
  const hasAnyMessage = Object.keys(fieldErrors).length > 0 || formErrors.length > 0;
  return { values, fieldErrors, formErrors: hasAnyMessage ? formErrors : [error] };
}

/** The interaction id from the hidden "interactionId" field, or null if invalid. */
function readInteractionId(formData: FormData): number | null {
  const raw = formData.get("interactionId");
  // Same digits-only check as customer ids (same database id range).
  return readCustomerId(typeof raw === "string" ? raw : undefined);
}

/** Forget kept pages, then go to the safe returnTo (or the Interactions page). */
function finish(formData: FormData): never {
  const returnTo = safeReturnPath(formData.get("returnTo"));
  revalidatePath("/", "layout");
  redirect(returnTo ?? DEFAULT_RETURN_PATH);
}

/** Log a new interaction. */
export async function createInteraction(
  _previousState: InteractionFormState,
  formData: FormData,
): Promise<InteractionFormState> {
  const values = readInteractionFormValues(formData);

  // Date + Time are checked here, because the backend only sees the joined ISO text.
  const when = kolkataInputsToIso(values.date, values.time);
  if (!when.ok) {
    return { values, fieldErrors: { occurredAt: when.error }, formErrors: [] };
  }

  const result = await backendSend<Interaction>(
    "POST",
    "/interactions",
    createInteractionBody(values, when.occurredAt),
  );
  if (!result.ok) {
    return failedState(values, result.error, result.details);
  }

  finish(formData);
}

/** Save changes to an interaction (its customer cannot change). */
export async function updateInteraction(
  _previousState: InteractionFormState,
  formData: FormData,
): Promise<InteractionFormState> {
  const values = readInteractionFormValues(formData);

  const interactionId = readInteractionId(formData);
  if (interactionId === null) {
    return { values, fieldErrors: {}, formErrors: [INTERACTION_GONE_MESSAGE] };
  }

  const when = kolkataInputsToIso(values.date, values.time);
  if (!when.ok) {
    return { values, fieldErrors: { occurredAt: when.error }, formErrors: [] };
  }

  const result = await backendSend<Interaction>(
    "PATCH",
    `/interactions/${interactionId}`,
    updateInteractionBody(values, when.occurredAt),
  );
  if (!result.ok) {
    if (result.status === 404) {
      return { values, fieldErrors: {}, formErrors: [INTERACTION_GONE_MESSAGE] };
    }
    return failedState(values, result.error, result.details);
  }

  finish(formData);
}

/** Delete an interaction for good. */
export async function deleteInteraction(
  _previousState: DeleteInteractionState,
  formData: FormData,
): Promise<DeleteInteractionState> {
  const interactionId = readInteractionId(formData);
  if (interactionId === null) {
    return { error: INTERACTION_GONE_MESSAGE };
  }

  const result = await backendSend<null>("DELETE", `/interactions/${interactionId}`);
  if (!result.ok) {
    return { error: result.status === 404 ? INTERACTION_GONE_MESSAGE : result.error };
  }

  finish(formData);
}
