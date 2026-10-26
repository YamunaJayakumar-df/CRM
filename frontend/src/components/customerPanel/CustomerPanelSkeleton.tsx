// CustomerPanelSkeleton: grey placeholders shaped like the customer panel
// (top buttons, avatar and name, action buttons, tabs, a few rows), shown
// while the customer's details load. Same layout as the real panel, so
// nothing jumps when it appears.
import Skeleton from "@/components/Skeleton";

export default function CustomerPanelSkeleton() {
  return (
    <div>
      <p className="sr-only" role="status">
        Loading customer…
      </p>
      <div className="flex items-center justify-between">
        <Skeleton className="h-11 w-20" />
        <Skeleton className="h-11 w-32" />
      </div>
      <div className="mt-6 flex items-center gap-4">
        <Skeleton circle className="h-16 w-16 shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-7 w-3/5" />
          <Skeleton className="mt-2 h-4 w-2/5" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-5">
        {[1, 2, 3, 4, 5].map((key) => (
          <Skeleton key={key} className="h-16 w-full" />
        ))}
      </div>
      <Skeleton className="mt-6 h-11 w-full" />
      <div className="mt-6 flex flex-col gap-4">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}
