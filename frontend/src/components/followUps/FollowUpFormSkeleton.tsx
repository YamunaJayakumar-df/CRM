// FollowUpFormSkeleton: grey placeholders for the New / Edit follow-up
// form, shown while the customers (or the saved follow-up) load.
// `withTitle` adds a title placeholder, for the Edit page, whose title
// only arrives with the data.
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";

type FollowUpFormSkeletonProps = {
  withTitle?: boolean;
};

export default function FollowUpFormSkeleton({ withTitle = false }: FollowUpFormSkeletonProps) {
  return (
    <div className="max-w-2xl">
      <p className="sr-only" role="status">
        Loading form…
      </p>
      {withTitle && (
        <div className="mb-8">
          <Skeleton className="h-8 w-64" />
        </div>
      )}
      <Card>
        <div className="flex flex-col gap-6">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-11 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-2 h-11 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-11 w-60" />
          </div>
          <div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-2 h-11 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-2 h-28 w-full" />
          </div>
        </div>
      </Card>
    </div>
  );
}
