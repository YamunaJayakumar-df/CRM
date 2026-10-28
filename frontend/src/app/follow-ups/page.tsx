// Follow-ups (/follow-ups): every task to get back to a customer by a date,
// soonest due first, with one-click "Mark done".
//
// URL filters (see lib/followUps/followUpsView.ts):
//   ?view=today|overdue|open|done|all  (default open)
//   ?q=text                            search in the title and company name
//   ?customerId=12                     only one customer (from the panel's "View all")
//
// How it loads (Next 16 with cacheComponents), like the Interactions page:
// - This page component is NOT async, so the title is sent at once.
// - "New follow-up" needs the URL (to come back to this exact view), so it
//   reads searchParams inside its own small <Suspense>; the fallback is the
//   same button pointing at the plain /follow-ups.
// - `searchParams` is a Promise, passed down unopened and awaited inside
//   <Suspense> by FollowUpsBody, which then loads the table.
// - If the backend cannot be reached, app/error.tsx shows "Try again".
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import FollowUpsBody from "@/components/followUps/FollowUpsBody";
import FollowUpsPageSkeleton from "@/components/followUps/FollowUpsPageSkeleton";
import NewFollowUpButton, { NewFollowUpButtonLink } from "@/components/followUps/NewFollowUpButton";

export default function FollowUpsPage({ searchParams }: PageProps<"/follow-ups">) {
  return (
    <>
      <PageHeader
        title="Follow-ups"
        subtitle="Things to get back to customers about, and when."
        right={
          <div className="self-start sm:self-auto">
            <Suspense fallback={<NewFollowUpButtonLink returnTo="/follow-ups" />}>
              <NewFollowUpButton searchParams={searchParams} />
            </Suspense>
          </div>
        }
      />
      <Suspense fallback={<FollowUpsPageSkeleton />}>
        <FollowUpsBody searchParams={searchParams} />
      </Suspense>
    </>
  );
}
