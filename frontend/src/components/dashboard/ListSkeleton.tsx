// ListSkeleton: placeholder rows (round avatar + two text lines) shown
// inside a card while its list loads. `label` is read out to screen readers,
// e.g. "Loading follow-ups…", because the grey blocks themselves are hidden.
import Skeleton from "@/components/Skeleton";

type ListSkeletonProps = {
  label: string;
  rows: number;
};

export default function ListSkeleton({ label, rows }: ListSkeletonProps) {
  const rowKeys = Array.from({ length: rows }, (_, index) => index);

  return (
    <div>
      <p className="sr-only" role="status">
        {label}
      </p>
      <ul className="flex flex-col gap-4">
        {rowKeys.map((key) => (
          <li key={key} className="flex items-center gap-3">
            <Skeleton circle className="h-10 w-10 shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="mt-2 h-3 w-3/5" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
