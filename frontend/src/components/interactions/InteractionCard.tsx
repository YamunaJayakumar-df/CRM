// InteractionCard: one card on the Kanban board.
//
// Top: the first line of the summary as the title (at most 2 lines), then a
// small chip with the time. Under a thin divider: the customer (initials
// avatar + name) and the date ("2 hours ago" today, "Yesterday", or
// "Oct 20, 2026").
//
// Two links, side by side (links may not sit inside each other):
// - The main one is the title. Its invisible ::after layer stretches over
//   the whole card ("stretched link"), so clicking anywhere on the card
//   still opens that customer's page on its Interactions tab (/customers/12?tab=interactions).
//   With the keyboard, its focus ring shows around the title.
// - A small pencil in the top-right corner opens the Edit page. It sits
//   above the stretched layer (z-10), so it gets its own clicks and focus.
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import LetterAvatar from "@/components/LetterAvatar";
import type { Interaction } from "@/lib/api/types";
import { customerPageHref } from "@/lib/customers/customerHrefs";
import { formatRelativeTime, formatTime } from "@/lib/format/dates";
import { firstLine } from "@/lib/format/firstLine";
import { interactionTypeLabel } from "@/lib/format/labels";
import { interactionEditHref } from "@/lib/interactions/interactionHrefs";
import EditInteractionIconLink from "./EditInteractionIconLink";

type InteractionCardProps = {
  interaction: Interaction;
  /** The moment the page was rendered, for "2 hours ago". */
  now: Date;
  /** The current page URL, so Edit comes back here. */
  returnTo: string;
};

export default function InteractionCard({ interaction, now, returnTo }: InteractionCardProps) {
  const { customer } = interaction;
  // The summary's first line is the most useful title; the type is the fallback.
  const title = firstLine(interaction.summary) || interactionTypeLabel(interaction.type);

  return (
    <article className="relative rounded-xl border border-line bg-card p-4 shadow-soft transition-colors duration-150 hover:bg-hover">
      <p className="line-clamp-2 pr-8 text-sm font-medium text-ink">
        <Link
          href={customerPageHref(customer.id, "interactions")}
          className="rounded-sm after:absolute after:inset-0 after:rounded-xl"
        >
          {title}
          <span className="sr-only">, {customer.companyName}</span>
        </Link>
      </p>

      <EditInteractionIconLink
        href={interactionEditHref(interaction.id, returnTo)}
        title={title}
        className="absolute top-1 right-1 z-10"
      />

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
    </article>
  );
}
