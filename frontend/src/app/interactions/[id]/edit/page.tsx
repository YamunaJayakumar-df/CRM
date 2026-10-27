// Edit interaction (/interactions/5/edit?returnTo=...): the interaction
// form filled with the saved details, plus a Danger zone to delete it.
//
// How it loads (Next 16 with cacheComponents), like the Edit customer page:
// - `params` ({ id }) and `searchParams` (?returnTo) are Promises. This page
//   does not await them; EditInteractionContent awaits them inside
//   <Suspense>, with a skeleton until the interaction has loaded.
// - An invalid id, or an interaction that does not exist, calls notFound(),
//   which shows ./not-found.tsx.
import { Suspense } from "react";
import EditInteractionContent from "@/components/interactions/EditInteractionContent";
import InteractionFormSkeleton from "@/components/interactions/InteractionFormSkeleton";

export default function EditInteractionPage({
  params,
  searchParams,
}: PageProps<"/interactions/[id]/edit">) {
  return (
    <Suspense fallback={<InteractionFormSkeleton withTitle />}>
      <EditInteractionContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
