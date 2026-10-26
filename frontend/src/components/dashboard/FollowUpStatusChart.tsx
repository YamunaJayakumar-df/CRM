// FollowUpStatusChart: loads the dashboard summary and draws the
// follow-up status donut.
//
// Async Server Component, rendered inside <Suspense> by FollowUpStatusCard.
// The summary's `open` INCLUDES overdue follow-ups, so the blue "open on
// time" slice is open minus overdue (never below 0).
import StatusDonut from "@/components/StatusDonut";
import { getDashboardSummaryOnce } from "@/lib/api/requestMemo";

export default async function FollowUpStatusChart() {
  const { followUps } = await getDashboardSummaryOnce();

  return (
    <StatusDonut
      openOnTime={Math.max(followUps.open - followUps.overdue, 0)}
      overdue={followUps.overdue}
      completed={followUps.done}
    />
  );
}
