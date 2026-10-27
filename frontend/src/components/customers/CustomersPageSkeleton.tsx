// CustomersPageSkeleton: the search box and table placeholders, shown for
// the brief moment before the Customers page has read its URL.
import Skeleton from "@/components/Skeleton";
import CustomerTableSkeleton from "./CustomerTableSkeleton";

export default function CustomersPageSkeleton() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-11 w-full sm:w-80" />
      </div>
      <CustomerTableSkeleton />
    </>
  );
}
