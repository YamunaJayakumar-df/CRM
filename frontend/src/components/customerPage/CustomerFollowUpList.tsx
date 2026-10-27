// CustomerFollowUpList: a customer's follow-ups as a short list: calendar
// icon, title, "Due ..." and the priority pill (plus the status pill when
// `showStatus` is on, for lists that mix open and done ones).
// Due dates that need attention now (today or overdue, only for OPEN ones)
// are red; overdue ones also get a warning icon and the word "overdue" for
// screen readers, so it never depends on colour alone.
// Each item ends with a small pencil link to edit it (comes back to
// returnTo). Mark done lives in the Edit form and on the Follow-ups page:
// the panel is too narrow for a second icon without squeezing the title.
// Shows an EmptyState with `emptyMessage` when the list is empty.
import { CalendarCheck, CalendarClock, TriangleAlert } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import PriorityBadge from "@/components/PriorityBadge";
import StatusBadge from "@/components/StatusBadge";
import EditFollowUpIconLink from "@/components/followUps/EditFollowUpIconLink";
import type { FollowUp } from "@/lib/api/types";
import { formatDueDate } from "@/lib/format/dates";
import { followUpEditHref } from "@/lib/followUps/followUpHrefs";
import { followUpDueState } from "@/lib/format/followUpDue";

type CustomerFollowUpListProps = {
  followUps: FollowUp[];
  /** Today in India, "YYYY-MM-DD". */
  today: string;
  emptyMessage: string;
  showStatus?: boolean;
  /** The current dashboard URL (panel open), so Edit comes back here. */
  returnTo: string;
};

export default function CustomerFollowUpList({
  followUps,
  today,
  emptyMessage,
  showStatus = false,
  returnTo,
}: CustomerFollowUpListProps) {
  if (followUps.length === 0) {
    return (
      <EmptyState
        icon={<CalendarCheck size={28} strokeWidth={1.5} aria-hidden="true" />}
        message={emptyMessage}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {followUps.map((followUp) => {
        const dueState = followUpDueState(followUp.status, followUp.dueDate, today);
        const dueColour = dueState === "later" ? "text-muted" : "font-medium text-danger";

        return (
          <li key={followUp.id} className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <CalendarClock size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{followUp.title}</p>
              <p className={`mt-0.5 inline-flex items-center gap-1 text-xs ${dueColour}`}>
                {dueState === "overdue" && (
                  <TriangleAlert size={12} strokeWidth={2} aria-hidden="true" />
                )}
                Due <time dateTime={followUp.dueDate}>{formatDueDate(followUp.dueDate, today)}</time>
                {dueState === "overdue" && <span className="sr-only">(overdue)</span>}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {showStatus && <StatusBadge status={followUp.status} />}
              <PriorityBadge priority={followUp.priority} />
            </div>
            <EditFollowUpIconLink
              href={followUpEditHref(followUp.id, returnTo)}
              title={followUp.title}
              className="-my-2.5 -mr-3"
            />
          </li>
        );
      })}
    </ul>
  );
}
