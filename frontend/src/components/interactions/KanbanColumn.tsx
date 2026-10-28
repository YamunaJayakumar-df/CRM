// KanbanColumn: one column of the board (Calls, Emails, Meetings or Notes).
//
// Header: the coloured type pill, the number of cards, and a "+" link that
// opens the Log form with this type already chosen (and ?returnTo= this
// page, so saving comes straight back).
// Body: the cards, newest first, or a small "No calls" line when empty.
// If the column came back full (50), "50+" and "Showing latest 50" make it
// clear there may be older ones not shown.
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Interaction } from "@/lib/api/types";
import { interactionTypeLabel } from "@/lib/format/labels";
import { newInteractionHref } from "@/lib/interactions/interactionHrefs";
import { isListCapped, type KanbanColumn as KanbanColumnInfo } from "@/lib/interactions/kanbanColumns";
import InteractionCard from "./InteractionCard";
import InteractionTypePill from "./InteractionTypePill";
import { KANBAN_COLUMN_CLASSES } from "./KanbanBoardFrame";

type KanbanColumnProps = {
  column: KanbanColumnInfo;
  interactions: Interaction[];
  /** Most cards loaded for this column. */
  limit: number;
  now: Date;
  /** The current Interactions page URL, for the Log and Edit links. */
  returnTo: string;
};

export default function KanbanColumn({
  column,
  interactions,
  limit,
  now,
  returnTo,
}: KanbanColumnProps) {
  const headingId = `kanban-${column.type.toLowerCase()}`;
  const capped = isListCapped(interactions.length, limit);
  const countText = capped ? `${interactions.length}+` : String(interactions.length);
  // e.g. "New meeting" (tooltip and screen reader name of the "+" link).
  const logLabel = `New ${interactionTypeLabel(column.type).toLowerCase()}`;

  return (
    <section aria-labelledby={headingId} className={KANBAN_COLUMN_CLASSES}>
      <div className="mb-3 flex items-center justify-between gap-2 pl-1">
        <h2 id={headingId} className="flex items-center gap-2">
          <InteractionTypePill type={column.type} label={column.title} />
          <span className="text-sm font-medium text-muted">
            {countText}
            <span className="sr-only"> shown</span>
          </span>
        </h2>
        <Link
          href={newInteractionHref({ type: column.type, returnTo })}
          aria-label={logLabel}
          title={logLabel}
          className="-my-2 inline-flex h-11 w-11 items-center justify-center rounded-xl text-icon transition-colors duration-150 hover:bg-hover hover:text-ink"
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>

      {interactions.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-muted">{column.emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {interactions.map((interaction) => (
            <li key={interaction.id}>
              <InteractionCard interaction={interaction} now={now} returnTo={returnTo} />
            </li>
          ))}
        </ul>
      )}

      {capped && <p className="px-1 pt-3 text-xs text-muted">Showing latest {limit}</p>}
    </section>
  );
}
