// FollowUpsBody: everything under the Follow-ups page title.
//
// Same shape as InteractionsBody:
// 1. Reads the filters from the URL (view, search, customer). `searchParams`
//    is a Promise in Next 16; we await it HERE, inside the page's
//    <Suspense>, so the page title can still be sent at once.
// 2. Shows the toolbar straight away (it needs only the URL).
// 3. Loads the table inside its own <Suspense>. Its `key` is the current
//    filter, so changing a filter shows the loading skeleton instead of
//    leaving the old results on screen.
import { Suspense } from "react";
import {
  followUpsStateKey,
  readFollowUpsState,
  type FollowUpsSearchParams,
} from "@/lib/followUps/followUpsView";
import FollowUpsResults from "./FollowUpsResults";
import FollowUpsTableSkeleton from "./FollowUpsTableSkeleton";
import FollowUpsToolbar from "./FollowUpsToolbar";

type FollowUpsBodyProps = {
  searchParams: Promise<FollowUpsSearchParams>;
};

export default async function FollowUpsBody({ searchParams }: FollowUpsBodyProps) {
  const state = readFollowUpsState(await searchParams);

  return (
    <>
      <FollowUpsToolbar state={state} />
      <Suspense key={followUpsStateKey(state)} fallback={<FollowUpsTableSkeleton />}>
        <FollowUpsResults state={state} />
      </Suspense>
    </>
  );
}
