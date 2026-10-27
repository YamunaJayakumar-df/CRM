// Customer page (/customers/34?tab=...): one customer's full details, with
// tabs: Overview (default), Interactions, Follow-ups, Notes.
//
// How it loads (Next 16 with cacheComponents), like the Edit customer page:
// - `params` ({ id }) and `searchParams` (?tab) are Promises. This page does
//   not await them; CustomerPageContent awaits them inside <Suspense>, and a
//   skeleton is shown meanwhile.
// - An id that is not a positive whole number, or a customer that does not
//   exist, calls notFound(), which shows ./not-found.tsx.
// - If the backend cannot be reached, app/error.tsx shows "Try again".
import { Suspense } from "react";
import CustomerPageContent from "@/components/customerPage/CustomerPageContent";
import CustomerPageSkeleton from "@/components/customerPage/CustomerPageSkeleton";

export default function CustomerPage({ params, searchParams }: PageProps<"/customers/[id]">) {
  return (
    <Suspense fallback={<CustomerPageSkeleton />}>
      <CustomerPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
