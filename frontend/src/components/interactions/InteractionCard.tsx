// InteractionCard: one card on the Kanban board.
//
// Top: the first line of the summary as the title (at most 2 lines), then a
// small chip with the time. Under a thin divider: the customer (initials
// avatar + name) and the date ("2 hours ago" today, "Yesterday", or
// "Oct 20, 2026").
// The whole card is one link to the dashboard with that customer's side
// panel open (/?customer=12), the quickest way to see the full context.
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import LetterAvatar from "@/components/LetterAvatar";
import type { Interaction } from "@/lib/api/types";
import { customerPanelHref } from "@/lib/dashboard/customerPanelView";
import { formatRelativeTime, formatTime } from "@/lib/format/dates";
import { firstLine } from "@/lib/format/firstLine";
import { interactionTypeLabel } from "@/lib/format/labels";

type InteractionCardProps = {
  interaction: Interaction;
  /** The moment the page was rendered, for "2 hours ago". */
  now: Date;
};

export default function InteractionCard({ interaction, now }: InteractionCardProps) {
  const { customer } = interaction;
  // The summary's first line is the most useful title; the type is the fallback.
  const title = firstLine(interaction.summary) || interactionTypeLabel(interaction.type);

  return (
    <Link
      href={customerPanelHref(customer.id, "all", "")}
      className="block rounded-xl border border-line bg-card p-4 shadow-soft transition-colors duration-150 hover:bg-hover"
    >
      <p className="line-clamp-2 text-sm font-medium text-ink">{title}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-selected px-2.5 py-0.5 text-xs font-medium text-muted">
          <Clock size={12} strokeWidth={2} aria-hidden="true" />
          {formatTime(interaction.occurredAt)}
        </span>
      </div>

      <div className="my-3 border-t border-line" aria-hidden="true" />

      <div className="flex items-center gap-2">
        <LetterAvatar name={customer.companyName} size="sm" />
        <span className="truncate text-sm text-ink">{customer.companyName}</span>
      </div>
      <p className="mt-2 flex items-center gap-2 text-xs text-muted">
        <CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" />
        <time dateTime={interaction.occurredAt}>
          {formatRelativeTime(interaction.occurredAt, now)}
        </time>
      </p>
    </Link>
  );
}
