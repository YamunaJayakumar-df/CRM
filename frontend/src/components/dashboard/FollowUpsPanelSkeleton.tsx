// FollowUpsPanelSkeleton: placeholder chips, search box and rows shown in
// the "Upcoming Follow-ups" card while its data loads.
import Skeleton from "@/components/Skeleton";
import ListSkeleton from "./ListSkeleton";

export default function FollowUpsPanelSkeleton() {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-20" />
          <Skeleton className="h-11 w-24" />
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-32" />
        </div>
        <Skeleton className="h-11 w-full lg:w-64" />
      </div>
      <ListSkeleton label="Loading follow-ups…" rows={5} />
    </div>
  );
}
