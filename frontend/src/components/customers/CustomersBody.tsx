// CustomersBody: everything under the Customers page title.
//
// 1. Reads the search text from the URL (?q=). `searchParams` is a Promise
//    in Next 16; we await it HERE, inside the page's <Suspense>.
// 2. Shows the search box straight away (it needs only the URL).
// 3. Loads the table inside its own <Suspense>. Its `key` is the search
//    text, so a new search shows the loading skeleton instead of leaving
//    the old results on screen.
import { Suspense } from "react";
import { readCustomerSearch, type CustomersSearchParams } from "@/lib/customers/customerHrefs";
import CustomerResults from "./CustomerResults";
import CustomerSearchForm from "./CustomerSearchForm";
import CustomerTableSkeleton from "./CustomerTableSkeleton";

type CustomersBodyProps = {
  searchParams: Promise<CustomersSearchParams>;
};

export default async function CustomersBody({ searchParams }: CustomersBodyProps) {
  const search = readCustomerSearch((await searchParams).q);

  return (
    <>
      <div className="mb-6">
        <CustomerSearchForm search={search} />
      </div>
      <Suspense key={search} fallback={<CustomerTableSkeleton />}>
        <CustomerResults search={search} />
      </Suspense>
    </>
  );
}
