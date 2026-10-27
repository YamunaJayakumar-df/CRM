// FollowUpsResults: loads and shows the follow-ups table.
//
// Async Server Component, rendered inside <Suspense> by FollowUpsBody.
// One backend request, soonest due first, up to 200 rows. If the list came
// back full, a note says only the first 200 are shown.
// Nothing found -> a friendly empty state for this view.
// If the backend fails, the error goes to app/error.tsx ("Try again").
import { CalendarCheck } from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { listFollowUps } from "@/lib/api/queries";
import {
  FOLLOW_UPS_PAGE_LIMIT,
  followUpsEmptyText,
  followUpsFiltersFor,
  followUpsHref,
  type FollowUpsState,
} from "@/lib/followUps/followUpsView";
import { todayInKolkata } from "@/lib/format/dates";
import { isListCapped } from "@/lib/interactions/kanbanColumns";
import FollowUpsTable from "./FollowUpsTable";

type FollowUpsResultsProps = {
  state: FollowUpsState;
};

export default async function FollowUpsResults({ state }: FollowUpsResultsProps) {
  const followUps = await listFollowUps(followUpsFiltersFor(state, FOLLOW_UPS_PAGE_LIMIT));

  if (followUps.length === 0) {
    const { message, hint } = followUpsEmptyText(state);
    return (
      <Card>
        <EmptyState
          icon={<CalendarCheck size={28} strokeWidth={1.5} aria-hidden="true" />}
          message={message}
          hint={hint}
        />
      </Card>
    );
  }

  // Read after the backend call, so it is the real "today" (India).
  const today = todayInKolkata(new Date());

  return (
    <Card>
      <FollowUpsTable followUps={followUps} today={today} returnTo={followUpsHref(state)} />
      {isListCapped(followUps.length, FOLLOW_UPS_PAGE_LIMIT) && (
        <p className="mt-4 text-xs text-muted">Showing the first {FOLLOW_UPS_PAGE_LIMIT}</p>
      )}
    </Card>
  );
}
