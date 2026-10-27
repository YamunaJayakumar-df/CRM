// InteractionTimeline: a customer's interactions, newest first, as a
// timeline: a tinted icon per item joined by a thin vertical line, the
// first line of the summary, the date and time (India), a type pill, and
// a small pencil link to edit the item (it comes back to returnTo).
// Shows an EmptyState when there are none.
import { MessagesSquare } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ActivityIcon from "@/components/dashboard/ActivityIcon";
import EditInteractionIconLink from "@/components/interactions/EditInteractionIconLink";
import type { Interaction } from "@/lib/api/types";
import { formatShortDate, formatTime } from "@/lib/format/dates";
import { firstLine } from "@/lib/format/firstLine";
import { interactionTypeLabel } from "@/lib/format/labels";
import { interactionEditHref } from "@/lib/interactions/interactionHrefs";
import InteractionTypeBadge from "./InteractionTypeBadge";

type InteractionTimelineProps = {
  interactions: Interaction[];
  /** The current dashboard URL (panel open), so Edit comes back here. */
  returnTo: string;
};

export default function InteractionTimeline({ interactions, returnTo }: InteractionTimelineProps) {
  if (interactions.length === 0) {
    return (
      <EmptyState
        icon={<MessagesSquare size={28} strokeWidth={1.5} aria-hidden="true" />}
        message="No interactions yet"
        hint="Calls, emails, meetings and notes with this customer will appear here."
      />
    );
  }

  return (
    <ol className="flex flex-col">
      {interactions.map((interaction, index) => {
        const isLast = index === interactions.length - 1;
        // The summary's first line is the most useful title; the type is the fallback.
        const title = firstLine(interaction.summary) || interactionTypeLabel(interaction.type);

        return (
          <li key={interaction.id} className={`relative flex items-start gap-3 ${isLast ? "" : "pb-6"}`}>
            {/* The line joining this icon to the next one (decoration only). */}
            {!isLast && (
              <span
                className="absolute top-12 bottom-2 left-5 w-px -translate-x-1/2 bg-line"
                aria-hidden="true"
              />
            )}
            <ActivityIcon type={interaction.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{title}</p>
              <p className="mt-0.5 text-xs text-muted">
                <time dateTime={interaction.occurredAt}>
                  {formatShortDate(interaction.occurredAt)} · {formatTime(interaction.occurredAt)}
                </time>
              </p>
            </div>
            <InteractionTypeBadge type={interaction.type} />
            <EditInteractionIconLink
              href={interactionEditHref(interaction.id, returnTo)}
              title={title}
              className="-my-2.5 -mr-3"
            />
          </li>
        );
      })}
    </ol>
  );
}
