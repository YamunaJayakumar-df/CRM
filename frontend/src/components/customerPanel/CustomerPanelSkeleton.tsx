// CustomerPanelSkeleton: grey placeholders shaped like the customer card's
// summary (avatar and name, contact lines, section rows, buttons), shown
// while the customer's details load. Same layout as the real card, so
// nothing jumps when it appears.
import Skeleton from "@/components/Skeleton";

export default function CustomerPanelSkeleton() {
  return (
    <div>
      <p className="sr-only" role="status">
        Loading customer…
      </p>
      <div className="flex items-start gap-3">
        <Skeleton circle className="h-10 w-10 shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="mt-2 h-5 w-2/5" />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-4 w-3/5" />
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-2">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-11 w-20" />
        <Skeleton className="h-11 w-20" />
        <Skeleton className="h-11 flex-1" />
      </div>
    </div>
  );
}
