// CustomersBody: the customer table under the search box.
//
// 1. Reads the search text from the URL (?q=). `searchParams` is a Promise
//    in Next 16; we await it HERE, inside the page's <Suspense>.
// 2. Loads the table inside its own <Suspense>. Its `key` is the search
//    text, so a new search shows the loading skeleton instead of leaving
//    the old results on screen.
// (The search box itself is CustomersSearch, placed above the table and the
// customer card so both start at the same height.)
import { Suspense } from "react";
import { readCustomerSearch, type CustomersSearchParams } from "@/lib/customers/customerHrefs";
import CustomerResults from "./CustomerResults";
import CustomerTableSkeleton from "./CustomerTableSkeleton";

type CustomersBodyProps = {
  searchParams: Promise<CustomersSearchParams>;
};

export default async function CustomersBody({ searchParams }: CustomersBodyProps) {
  const search = readCustomerSearch((await searchParams).q);

  return (
    <Suspense key={search} fallback={<CustomerTableSkeleton />}>
      <CustomerResults search={search} />
    </Suspense>
  );
}
