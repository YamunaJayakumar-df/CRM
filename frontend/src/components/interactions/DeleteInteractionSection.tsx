// DeleteInteractionSection: the small "Danger zone" under the Edit form.
//
// Deleting can not be undone, so it is never one click:
// 1. "Delete interaction" is the <summary> of a native <details> element.
//    Clicking it (or Enter / Space on it) only opens the confirm step. No
//    JavaScript is needed for this, and screen readers announce it as
//    expandable ("collapsed" / "expanded").
// 2. Inside: "Delete this interaction? This cannot be undone." and the red
//    "Yes, delete" button, which sends the deleteInteraction Server Action.
//    Clicking "Delete interaction" again closes it ("Keep it" in effect).
// If deleting fails (e.g. someone else already deleted it), the message is
// shown here. On success the action redirects away.
// ResetAfterSubmit closes the step again if the user later comes Back.
"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteInteraction, type DeleteInteractionState } from "@/app/interactions/actions";
import ResetAfterSubmit from "@/components/forms/ResetAfterSubmit";
import SubmitButton from "@/components/forms/SubmitButton";

type DeleteInteractionSectionProps = {
  interactionId: number;
  /** A safe internal path to go to after deleting. */
  returnTo: string | null;
};

const INITIAL_STATE: DeleteInteractionState = { error: null };

function DeleteInteractionForm({ interactionId, returnTo }: DeleteInteractionSectionProps) {
  const [state, formAction] = useActionState(deleteInteraction, INITIAL_STATE);

  return (
    <details className="mt-4">
      <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover [&::-webkit-details-marker]:hidden">
        <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" className="text-icon" />
        Delete interaction
      </summary>

      <form action={formAction} className="mt-4">
        <input type="hidden" name="interactionId" value={interactionId} />
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

        <p className="text-sm text-ink">Delete this interaction? This cannot be undone.</p>
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

export default function DeleteInteractionSection(props: DeleteInteractionSectionProps) {
  return (
    <section aria-labelledby="danger-zone-heading" className="mt-8 rounded-xl border border-line p-6">
      <h2 id="danger-zone-heading" className="text-base font-medium text-ink">
        Danger zone
      </h2>
      <p className="mt-1 text-sm text-muted">Deleting removes this interaction from the CRM.</p>
      <ResetAfterSubmit>
        <DeleteInteractionForm {...props} />
      </ResetAfterSubmit>
    </section>
  );
}
