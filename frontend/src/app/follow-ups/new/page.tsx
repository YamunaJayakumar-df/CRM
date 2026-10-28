// New follow-up (/follow-ups/new?customerId=12&returnTo=...)
//
// How it loads (Next 16 with cacheComponents), like Log interaction:
// - The title needs no data, so it is sent at once.
// - The form needs the customer list (for the drop-down) and the URL
//   (preselected customer, returnTo). Both are read inside <Suspense> by
//   NewFollowUpContent; meanwhile a skeleton is shown.
// Saving runs the createFollowUp Server Action (../actions.ts).
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import FollowUpFormSkeleton from "@/components/followUps/FollowUpFormSkeleton";
import NewFollowUpContent from "@/components/followUps/NewFollowUpContent";

export default function NewFollowUpPage({ searchParams }: PageProps<"/follow-ups/new">) {
  return (
    <>
      <PageHeader title="New follow-up" subtitle="Something to get back to a customer about, by a date." />
      <Suspense fallback={<FollowUpFormSkeleton />}>
        <div className="max-w-2xl">
          <NewFollowUpContent searchParams={searchParams} />
        </div>
      </Suspense>
    </>
  );
}
