// FollowUpDueDate: a follow-up's due day as text ("Today", "Tomorrow",
// "Oct 30, 2026"), used in the follow-up tables.
//
// Open follow-ups that need attention now (overdue or due today) are red
// with a warning icon. Overdue ones also say "(overdue)" to screen readers,
// so lateness never depends on the colour alone ("Today" already says it
// in words). Done follow-ups are never urgent.
import { TriangleAlert } from "lucide-react";
import type { FollowUp } from "@/lib/api/types";
import { formatDueDate } from "@/lib/format/dates";
import { followUpDueState } from "@/lib/format/followUpDue";

type FollowUpDueDateProps = {
  followUp: Pick<FollowUp, "status" | "dueDate">;
  /** Today in India, "YYYY-MM-DD". */
  today: string;
};

export default function FollowUpDueDate({ followUp, today }: FollowUpDueDateProps) {
  const dueState = followUpDueState(followUp.status, followUp.dueDate, today);
  const urgent = dueState !== "later";

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm whitespace-nowrap ${
        urgent ? "font-medium text-danger" : "text-ink"
      }`}
    >
      {urgent && <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" />}
      <time dateTime={followUp.dueDate}>{formatDueDate(followUp.dueDate, today)}</time>
      {dueState === "overdue" && <span className="sr-only">(overdue)</span>}
    </span>
  );
}
