// StatCardsSkeleton: four calm placeholder boxes, the same size as the real
// stat cards, shown while the dashboard numbers load.
import Skeleton from "@/components/Skeleton";

export default function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <p className="sr-only" role="status">
        Loading dashboard numbers…
      </p>
      {[1, 2, 3, 4].map((key) => (
        <div key={key} className="rounded-xl border border-line bg-card p-5 shadow-soft">
          <Skeleton circle className="h-10 w-10" />
          <Skeleton className="mt-4 h-4 w-28" />
          <Skeleton className="mt-2 h-8 w-16" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
