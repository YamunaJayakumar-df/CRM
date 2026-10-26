// KanbanResults: loads and shows the Kanban board.
//
// Async Server Component, rendered inside <Suspense> by InteractionsBody.
// Each column is its own backend request (?type=CALL, ?type=EMAIL, ...),
// all sent AT THE SAME TIME with Promise.all, so a busy column cannot push
// the others out. Each column gets up to 50 of its newest items.
// `new Date()` is read AFTER the backend calls (like RecentActivityList), so
// "2 hours ago" is measured from the real moment of this request.
// If every column is empty, one friendly empty state replaces the board.
// If the backend fails, the error goes to app/error.tsx ("Try again").
import { listInteractions } from "@/lib/api/queries";
import {
  interactionFiltersFor,
  type InteractionsState,
} from "@/lib/interactions/interactionsView";
import { KANBAN_COLUMN_LIMIT, KANBAN_COLUMNS } from "@/lib/interactions/kanbanColumns";
import InteractionsEmptyState from "./InteractionsEmptyState";
import KanbanBoardFrame from "./KanbanBoardFrame";
import KanbanColumn from "./KanbanColumn";

type KanbanResultsProps = {
  state: InteractionsState;
};

export default async function KanbanResults({ state }: KanbanResultsProps) {
  const columnLists = await Promise.all(
    KANBAN_COLUMNS.map((column) =>
      listInteractions(interactionFiltersFor(state, KANBAN_COLUMN_LIMIT, column.type)),
    ),
  );
  const now = new Date();

  const isEmpty = columnLists.every((list) => list.length === 0);
  if (isEmpty) {
    return <InteractionsEmptyState state={state} />;
  }

  return (
    <KanbanBoardFrame label="Interactions board">
      {KANBAN_COLUMNS.map((column, index) => (
        <KanbanColumn
          key={column.type}
          column={column}
          interactions={columnLists[index]}
          limit={KANBAN_COLUMN_LIMIT}
          now={now}
        />
      ))}
    </KanbanBoardFrame>
  );
}
