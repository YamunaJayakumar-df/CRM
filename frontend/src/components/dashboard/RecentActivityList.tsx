// RecentActivityList: the newest few interactions (calls, emails, meetings,
// notes), newest first, e.g. "Call with Acme Corp · 2 hours ago".
//
// Async Server Component, rendered inside <Suspense> by RecentActivity.
// About reading the clock: `new Date()` is read AFTER the backend call.
// That await already makes this component run per request (never
// prebuilt), so "2 hours ago" is always measured from the real "now".
// If the backend fails, the error goes to app/error.tsx ("Try again").
import { MessagesSquare } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { listInteractions } from "@/lib/api/queries";
import { activityTitle } from "@/lib/format/activityTitle";
import { formatRelativeTime } from "@/lib/format/dates";
import { firstLine } from "@/lib/format/firstLine";
import ActivityIcon from "./ActivityIcon";

/** How many interactions the card shows. */
export const RECENT_ACTIVITY_ROWS = 4;

export default async function RecentActivityList() {
  const interactions = await listInteractions({ limit: RECENT_ACTIVITY_ROWS });
  const now = new Date();

  if (interactions.length === 0) {
    return (
      <EmptyState
        icon={<MessagesSquare size={28} strokeWidth={1.5} aria-hidden="true" />}
        message="No recent activity"
        hint="Calls, emails, meetings and notes will appear here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {interactions.map((interaction) => {
        const summary = firstLine(interaction.summary);
        return (
          <li key={interaction.id} className="flex items-start gap-3">
            <ActivityIcon type={interaction.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {activityTitle(interaction.type, interaction.customer.companyName)}
              </p>
              {summary !== "" && <p className="truncate text-sm text-muted">{summary}</p>}
            </div>
            <time
              dateTime={interaction.occurredAt}
              className="shrink-0 text-xs whitespace-nowrap text-muted"
            >
              {formatRelativeTime(interaction.occurredAt, now)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
