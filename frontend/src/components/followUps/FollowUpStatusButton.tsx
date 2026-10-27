// FollowUpStatusButton: the one-click "Mark done" (or "Reopen") button
// used in follow-up lists.
//
// It is a tiny form that sends the setFollowUpStatus Server Action with
// three hidden fields: which follow-up, its NEW status (Open -> Done, Done
// -> Open) and returnTo (this page, so the user stays where they are).
// No confirm step: the change is harmless and undone just as easily.
//
// Two looks:
// - "button": an outlined button with an icon and words (Follow-ups page)
// - "icon": a 44 x 44px check icon only, for tight rows (dashboard table);
//   aria-label names it, with the follow-up's title so a list of them is
//   not just "Mark done, Mark done".
// While sending, the button is disabled (no double clicks) and says so.
"use client";

import { useFormStatus } from "react-dom";
import { Check, RotateCcw } from "lucide-react";
import { setFollowUpStatus } from "@/app/follow-ups/actions";
import type { FollowUpStatus } from "@/lib/api/types";

type FollowUpStatusButtonProps = {
  followUpId: number;
  /** The follow-up's CURRENT status; the button switches it. */
  status: FollowUpStatus;
  /** The follow-up's title, for screen readers. */
  title: string;
  /** The current page, to come back to. */
  returnTo: string;
  look?: "button" | "icon";
};

type InnerButtonProps = {
  label: string;
  title: string;
  isDone: boolean;
  look: "button" | "icon";
};

const iconProps = { size: 16, strokeWidth: 2, "aria-hidden": true } as const;

/** The button itself. Separate, because useFormStatus must sit INSIDE the form. */
function InnerButton({ label, title, isDone, look }: InnerButtonProps) {
  const { pending } = useFormStatus();
  const icon = isDone ? <RotateCcw {...iconProps} /> : <Check {...iconProps} />;

  if (look === "icon") {
    return (
      <button
        type="submit"
        disabled={pending}
        aria-label={`${label}: ${title}`}
        title={label}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-icon transition-colors duration-150 hover:bg-hover hover:text-ink disabled:cursor-wait disabled:opacity-50"
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium whitespace-nowrap text-ink transition-colors duration-150 hover:bg-hover disabled:cursor-wait disabled:opacity-70"
    >
      <span className="text-icon">{icon}</span>
      {pending ? "Saving…" : label}
      <span className="sr-only">: {title}</span>
    </button>
  );
}

export default function FollowUpStatusButton({
  followUpId,
  status,
  title,
  returnTo,
  look = "button",
}: FollowUpStatusButtonProps) {
  const isDone = status === "DONE";

  return (
    <form action={setFollowUpStatus} className="inline-flex">
      <input type="hidden" name="followUpId" value={followUpId} />
      <input type="hidden" name="status" value={isDone ? "OPEN" : "DONE"} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <InnerButton label={isDone ? "Reopen" : "Mark done"} title={title} isDone={isDone} look={look} />
    </form>
  );
}
