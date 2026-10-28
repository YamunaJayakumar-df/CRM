// KanbanBoardSkeleton: four grey placeholder columns, each with a few card
// shapes, shown while the board loads. Uses the same frame and column look
// as the real board, so nothing jumps when the data arrives.
import Skeleton from "@/components/Skeleton";
import KanbanBoardFrame, { KANBAN_COLUMN_CLASSES } from "./KanbanBoardFrame";

const columnKeys = [0, 1, 2, 3];
const cardKeys = [0, 1, 2];

export default function KanbanBoardSkeleton() {
  return (
    <div>
      <p className="sr-only" role="status">
        Loading interactions…
      </p>
      <KanbanBoardFrame label="Interactions board (loading)">
        {columnKeys.map((columnKey) => (
          <div key={columnKey} className={KANBAN_COLUMN_CLASSES}>
            <div className="mb-3 flex h-7 items-center gap-2 pl-1">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-6" />
            </div>
            <div className="flex flex-col gap-3">
              {cardKeys.map((cardKey) => (
                <Skeleton key={cardKey} className="h-36 w-full" />
              ))}
            </div>
          </div>
        ))}
      </KanbanBoardFrame>
    </div>
  );
}
