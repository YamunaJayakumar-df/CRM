// Log interaction (/interactions/new?customerId=12&type=MEETING&returnTo=...)
//
// How it loads (Next 16 with cacheComponents):
// - The title needs no data, so it is sent at once.
// - The form needs the customer list (for the drop-down) and the URL
//   (preselected customer / type, returnTo). Both are read inside
//   <Suspense> by NewInteractionContent; meanwhile a skeleton is shown.
// Saving runs the createInteraction Server Action (../actions.ts).
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import InteractionFormSkeleton from "@/components/interactions/InteractionFormSkeleton";
import NewInteractionContent from "@/components/interactions/NewInteractionContent";

export default function NewInteractionPage({ searchParams }: PageProps<"/interactions/new">) {
  return (
    <>
      <PageHeader title="Log interaction" subtitle="A call, email, meeting or note with a customer." />
      <Suspense fallback={<InteractionFormSkeleton />}>
        <div className="max-w-2xl">
          <NewInteractionContent searchParams={searchParams} />
        </div>
      </Suspense>
    </>
  );
}
