// CustomerPageSkeleton: grey placeholders shaped like a customer's page
// (back link, name and buttons, tab row, two columns of cards), shown while
// the customer loads. Same layout as the real page, so nothing jumps.
import Skeleton from "@/components/Skeleton";

export default function CustomerPageSkeleton() {
  return (
    <div>
      <p className="sr-only" role="status">
        Loading customer…
      </p>
      <Skeleton className="h-6 w-28" />
      <div className="mt-5 flex items-center gap-4">
        <Skeleton circle className="h-10 w-10 shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-8 w-2/5" />
          <Skeleton className="mt-2 h-5 w-1/5" />
        </div>
      </div>
      <Skeleton className="mt-8 mb-6 h-11 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full lg:col-span-2" />
      </div>
    </div>
  );
}
