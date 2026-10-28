// Edit follow-up (/follow-ups/5/edit?returnTo=...): the follow-up form
// filled with the saved details, plus a Danger zone to delete it.
//
// How it loads (Next 16 with cacheComponents), like Edit interaction:
// - `params` ({ id }) and `searchParams` (?returnTo) are Promises. This page
//   does not await them; EditFollowUpContent awaits them inside
//   <Suspense>, with a skeleton until the follow-up has loaded.
// - An invalid id, or a follow-up that does not exist, calls notFound(),
//   which shows ./not-found.tsx.
import { Suspense } from "react";
import EditFollowUpContent from "@/components/followUps/EditFollowUpContent";
import FollowUpFormSkeleton from "@/components/followUps/FollowUpFormSkeleton";

export default function EditFollowUpPage({
  params,
  searchParams,
}: PageProps<"/follow-ups/[id]/edit">) {
  return (
    <Suspense fallback={<FollowUpFormSkeleton withTitle />}>
      <EditFollowUpContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
