// FollowUpsPageSkeleton: grey placeholders for the toolbar and the table,
// shown for the brief moment before the page has read its URL filters.
import Skeleton from "@/components/Skeleton";
import FollowUpsTableSkeleton from "./FollowUpsTableSkeleton";

export default function FollowUpsPageSkeleton() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 w-full sm:w-72" />
        <Skeleton className="h-11 w-full max-w-96" />
      </div>
      <FollowUpsTableSkeleton />
    </div>
  );
}
