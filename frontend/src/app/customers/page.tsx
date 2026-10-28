// Customers (/customers): every customer company, A to Z, with a search box.
//
// URL: ?q=text searches company name, contact name, email and website
// (the backend does the matching). Clicking a company opens its own page
// (/customers/12).
//
// How it loads (Next 16 with cacheComponents), like the Interactions page:
// - This page component is NOT async, so the title and the "Add customer"
//   button are sent at once.
// - `searchParams` is a Promise, passed down unopened and awaited inside
//   <Suspense> by CustomersSearch and CustomersBody (which loads the table).
// - If the backend cannot be reached, app/error.tsx shows "Try again".
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import PrimaryButtonLink from "@/components/PrimaryButtonLink";
import CustomersBody from "@/components/customers/CustomersBody";
import CustomersSearch, { CustomersSearchSkeleton } from "@/components/customers/CustomersSearch";
import CustomerTableSkeleton from "@/components/customers/CustomerTableSkeleton";
import { NEW_CUSTOMER_HREF } from "@/lib/customers/customerHrefs";

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
      <Suspense fallback={<CustomerTableSkeleton />}>
        <CustomersBody searchParams={searchParams} />
      </Suspense>
    </>
  );
}
