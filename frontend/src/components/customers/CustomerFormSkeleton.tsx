// CustomerFormSkeleton: grey placeholders for the Edit customer page,
// shown while the customer's saved details load.
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";

const FIELD_COUNT = 6;

export default function CustomerFormSkeleton() {
  const fieldKeys = Array.from({ length: FIELD_COUNT }, (_, index) => index);

  return (
    <>
      <p className="sr-only" role="status">
        Loading customer…
      </p>
      <div className="mb-8">
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="max-w-2xl">
        <Card>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {fieldKeys.map((key) => (
              <div key={key}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-11 w-full" />
              </div>
            ))}
            <div className="md:col-span-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-32 w-full" />
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
