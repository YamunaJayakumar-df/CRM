// InteractionsPageSkeleton: grey placeholders for the toolbar and the board,
// shown for the brief moment before the page has read its URL filters.
import Skeleton from "@/components/Skeleton";
import KanbanBoardSkeleton from "./KanbanBoardSkeleton";

export default function InteractionsPageSkeleton() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 w-full sm:w-72" />
        <Skeleton className="h-11 w-72 sm:w-96" />
        <Skeleton className="ml-auto h-11 w-44" />
      </div>
      <KanbanBoardSkeleton />
    </div>
  );
}
