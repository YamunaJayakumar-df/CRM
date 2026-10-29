// ActivityCard: the "Activity" card on the dashboard: interactions per day
// over the last 14 days as a bar chart, with the total on the right.
// The card frame shows at once; the chart waits for the dashboard data
// (the same request the stat cards use, fetched once per page).
import { Suspense } from "react";
import { ChartColumn } from "lucide-react";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import { getDashboardSummaryOnce } from "@/lib/api/requestMemo";
import { daysEndingOn } from "@/lib/charts/barChart";
import ActivityChart from "./ActivityChart";

/** Loads the numbers, then draws the chart and the total. */
async function ActivityContent() {
  const { today, interactions } = await getDashboardSummaryOnce();
  const counts = interactions.dailyCount;
  const total = counts.reduce((sum, count) => sum + count, 0);

  return (
    <>
      <p className="mb-4 text-sm text-muted">
        <span className="text-stat font-semibold text-ink">{total}</span>
        <span className="ml-2">interactions in the last {counts.length} days</span>
      </p>
      <ActivityChart days={daysEndingOn(today, counts.length)} counts={counts} />
    </>
  );
}

function ActivitySkeleton() {
  return (
    <div>
      <p className="sr-only" role="status">
        Loading activity…
      </p>
      <Skeleton className="mb-4 h-9 w-48" />
      <Skeleton className="h-50 w-full" />
    </div>
  );
}

export default function ActivityCard() {
  return (
    <Card title="Activity" fullHeight icon={<ChartColumn size={20} strokeWidth={1.75} aria-hidden="true" />}>
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityContent />
      </Suspense>
    </Card>
  );
}
