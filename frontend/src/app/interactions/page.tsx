// Interactions (/interactions): every call, email, meeting and note with
// customers, as a Kanban board (default) or a table.
//
// URL filters (see lib/interactions/interactionsView.ts):
//   ?view=table|kanban   (default kanban)
//   ?range=7d|30d|90d|all (default 30d = last 30 days)
//   ?q=text              search in the summary and company name
//   ?customerId=12       only one customer (from the panel's "View all")
//
// How it loads (Next 16 with cacheComponents), like the dashboard:
// - This page component is NOT async, so the title is sent at once.
// - "Log Interaction" needs the URL (to come back to this exact view), so
//   it reads searchParams inside its own small <Suspense>; the fallback is
//   the same button pointing at the plain /interactions.
// - `searchParams` is a Promise, passed down unopened and awaited inside
//   <Suspense> by InteractionsBody, which then loads the board or table.
// - If the backend cannot be reached, app/error.tsx shows "Try again".
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import InteractionsBody from "@/components/interactions/InteractionsBody";
import InteractionsPageSkeleton from "@/components/interactions/InteractionsPageSkeleton";
import LogInteractionButton, {
  LogInteractionButtonLink,
} from "@/components/interactions/LogInteractionButton";

export default function InteractionsPage({ searchParams }: PageProps<"/interactions">) {
  return (
    <>
      <PageHeader
        title="Interactions"
        subtitle="Calls, emails, meetings and notes with your customers."
        right={
          <div className="self-start sm:self-auto">
            <Suspense fallback={<LogInteractionButtonLink returnTo="/interactions" />}>
              <LogInteractionButton searchParams={searchParams} />
            </Suspense>
          </div>
        }
      />
      <Suspense fallback={<InteractionsPageSkeleton />}>
        <InteractionsBody searchParams={searchParams} />
      </Suspense>
    </>
  );
}
