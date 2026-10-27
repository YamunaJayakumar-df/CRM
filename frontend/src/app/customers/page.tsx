// Customers (/customers): every customer company, A to Z, with a search box.
//
// URL: ?q=text searches company name, contact name, email and website
// (the backend does the matching). ?customer=12 opens that customer's card
// on this page (like on the dashboard), keeping the search.
//
// Layout, top to bottom: title, search box, then a row with the table and
// (when open) the customer card. The search box is ABOVE that row, so the
// table and the card start at the same height.
//
// How it loads (Next 16 with cacheComponents), like the Interactions page:
// - This page component is NOT async, so the title and the "Add customer"
//   button are sent at once.
// - `searchParams` is a Promise, passed down unopened and awaited inside
//   <Suspense> by CustomersSearch and CustomersBody (which loads the table).
// - The customer card is placed FIRST in its row so on smaller screens it
//   shows above the table; on wide (xl) screens it moves to a right-hand
//   column. Its Suspense has no fallback because with no ?customer there is
//   nothing to show.
// - If the backend cannot be reached, app/error.tsx shows "Try again".
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import PrimaryButtonLink from "@/components/PrimaryButtonLink";
import CustomerPanel from "@/components/customerPanel/CustomerPanel";
import CustomersBody from "@/components/customers/CustomersBody";
import CustomersSearch, { CustomersSearchSkeleton } from "@/components/customers/CustomersSearch";
import CustomerTableSkeleton from "@/components/customers/CustomerTableSkeleton";
import { NEW_CUSTOMER_HREF, readCustomersPanelPlace } from "@/lib/customers/customerHrefs";

export default function CustomersPage({ searchParams }: PageProps<"/customers">) {
  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="The companies you work with."
        right={<PrimaryButtonLink href={NEW_CUSTOMER_HREF}>Add customer</PrimaryButtonLink>}
      />
      <Suspense fallback={<CustomersSearchSkeleton />}>
        <CustomersSearch searchParams={searchParams} />
      </Suspense>
      {/* Two columns on wide screens: the table, plus the card on the right when open. */}
      <div className="flex flex-col gap-8 xl:flex-row">
        <Suspense fallback={null}>
          <CustomerPanel searchParams={searchParams} readPlace={readCustomersPanelPlace} />
        </Suspense>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<CustomerTableSkeleton />}>
            <CustomersBody searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
