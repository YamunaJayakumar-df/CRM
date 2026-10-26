// FollowUpCountBadge: the small number pill next to "Follow-ups" in the
// navigation, showing how many follow-ups are due today or overdue.
//
// The number needs the backend, so it loads inside <Suspense> and the
// navigation never waits for it: until it arrives (or if the backend
// fails, or the count is 0) there is simply no pill.
// Screen readers hear the full sentence, not just a bare number.
import { Suspense } from "react";
import { getDueFollowUpCount } from "@/lib/api/dueFollowUpCount";
import { dueFollowUpsLabel } from "@/lib/format/dueFollowUpsLabel";

async function CountPill() {
  const count = await getDueFollowUpCount();
  if (count === null || count === 0) {
    return null;
  }

  return (
    <span className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-soft px-2 text-xs font-medium text-accent">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">({dueFollowUpsLabel(count)})</span>
    </span>
  );
}

export default function FollowUpCountBadge() {
  return (
    <Suspense fallback={null}>
      <CountPill />
    </Suspense>
  );
}
