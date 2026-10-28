// The Interactions Kanban board's columns: one per interaction type.
//
// Why a list here (and not four copies in the UI): the board loops over
// this list, so the order, titles and empty texts live in ONE place.
// Typed with InteractionType, so a new type in api/types.ts is easy to add.
// Also holds how many rows each view loads, and the "is it capped?" check
// both views use.
import type { InteractionType } from "@/lib/api/types";

/** One column of the board. */
export type KanbanColumn = {
  type: InteractionType;
  /** Plural heading, e.g. "Calls". */
  title: string;
  /** Shown when the column has no cards, e.g. "No calls". */
  emptyText: string;
};

/** Columns in the order they are shown, left to right. */
export const KANBAN_COLUMNS: readonly KanbanColumn[] = [
  { type: "CALL", title: "Calls", emptyText: "No calls" },
  { type: "EMAIL", title: "Emails", emptyText: "No emails" },
  { type: "MEETING", title: "Meetings", emptyText: "No meetings" },
  { type: "NOTE", title: "Notes", emptyText: "No notes" },
];

/** Most cards loaded per column (newest first). */
export const KANBAN_COLUMN_LIMIT = 50;

/** Most rows loaded in the table view (newest first). */
export const INTERACTIONS_TABLE_LIMIT = 100;

/**
 * True when a list came back full, so there may be older items we did not
 * load. The UI then says "Showing latest 50" instead of pretending it is all.
 */
export function isListCapped(count: number, limit: number): boolean {
  return count >= limit;
}
