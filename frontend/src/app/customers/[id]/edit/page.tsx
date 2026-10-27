// Edit customer (/customers/12/edit?returnTo=...): the customer form,
// filled with the saved details.
//
// How it loads (Next 16 with cacheComponents):
// - `params` ({ id }) and `searchParams` (?returnTo) are Promises. This page
//   does not await them; it passes them into EditCustomerContent, which
//   awaits them inside <Suspense>. Meanwhile a skeleton is shown.
// - An id that is not a positive whole number, or a customer that does not
//   exist, calls notFound(), which shows ./not-found.tsx.
import { Suspense } from "react";
import CustomerFormSkeleton from "@/components/customers/CustomerFormSkeleton";
import EditCustomerContent from "@/components/customers/EditCustomerContent";

export default function EditCustomerPage({
  params,
  searchParams,
}: PageProps<"/customers/[id]/edit">) {
  return (
    <Suspense fallback={<CustomerFormSkeleton />}>
      <EditCustomerContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
