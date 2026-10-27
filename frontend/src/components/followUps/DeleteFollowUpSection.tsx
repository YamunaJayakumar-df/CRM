// DeleteFollowUpSection: the small "Danger zone" under the Edit form.
//
// Works exactly like DeleteInteractionSection (read its notes): deleting
// can not be undone, so it is never one click. "Delete follow-up" is the
// <summary> of a native <details> element and only opens the confirm step;
// the red "Yes, delete" button then sends the deleteFollowUp Server Action.
// Errors (e.g. someone else already deleted it) are shown here; on success
// the action redirects away. ResetAfterSubmit closes the step again if the
// user later comes Back.
"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteFollowUp, type DeleteFollowUpState } from "@/app/follow-ups/actions";
import ResetAfterSubmit from "@/components/forms/ResetAfterSubmit";
import SubmitButton from "@/components/forms/SubmitButton";

type DeleteFollowUpSectionProps = {
  followUpId: number;
  /** A safe internal path to go to after deleting. */
  returnTo: string | null;
};

const INITIAL_STATE: DeleteFollowUpState = { error: null };

function DeleteFollowUpForm({ followUpId, returnTo }: DeleteFollowUpSectionProps) {
  const [state, formAction] = useActionState(deleteFollowUp, INITIAL_STATE);

  return (
    <details className="mt-4">
      <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover [&::-webkit-details-marker]:hidden">
        <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" className="text-icon" />
        Delete follow-up
      </summary>

      <form action={formAction} className="mt-4">
        <input type="hidden" name="followUpId" value={followUpId} />
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

        <p className="text-sm text-ink">Delete this follow-up? This cannot be undone.</p>
        {state.error !== null && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        <div className="mt-4">
          <SubmitButton label="Yes, delete" pendingLabel="Deleting…" variant="danger" />
        </div>
      </form>
    </details>
  );
}

export default function DeleteFollowUpSection(props: DeleteFollowUpSectionProps) {
  return (
    <section aria-labelledby="danger-zone-heading" className="mt-8 rounded-xl border border-line p-6">
      <h2 id="danger-zone-heading" className="text-base font-medium text-ink">
        Danger zone
      </h2>
      <p className="mt-1 text-sm text-muted">
        Deleting removes this follow-up from the CRM. To keep it on record, mark it Done instead.
      </p>
      <ResetAfterSubmit>
        <DeleteFollowUpForm {...props} />
      </ResetAfterSubmit>
    </section>
  );
}
