// CustomersSearch: the search box row above the customer table.
//
// It is its own part of the page (not inside the table's column) so that,
// with a customer card open, the table and the card start at the same height.
// `searchParams` is a Promise in Next 16; it is awaited HERE, inside the
// page's <Suspense>, with CustomersSearchSkeleton as the placeholder.
import Skeleton from "@/components/Skeleton";
import { readCustomerSearch, type CustomersSearchParams } from "@/lib/customers/customerHrefs";
import CustomerSearchForm from "./CustomerSearchForm";

type CustomersSearchProps = {
  searchParams: Promise<CustomersSearchParams>;
};

export default async function CustomersSearch({ searchParams }: CustomersSearchProps) {
  const search = readCustomerSearch((await searchParams).q);

  return (
    <div className="mb-6">
      <CustomerSearchForm search={search} />
    </div>
  );
}

/** Same size as the search row, shown for the moment before the URL is read. */
export function CustomersSearchSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-11 w-full sm:w-80" />
    </div>
  );
}
