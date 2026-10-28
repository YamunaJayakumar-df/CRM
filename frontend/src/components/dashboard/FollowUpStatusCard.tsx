// FollowUpStatusCard: the "Follow-up Status" card: a donut chart of open,
// overdue and completed follow-ups, then the Quick Actions buttons.
// The quick actions need no data, so they show at once; only the chart
// waits for the backend (FollowUpStatusChart inside <Suspense>).
import { Suspense } from "react";
import { ChartPie } from "lucide-react";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import FollowUpStatusChart from "./FollowUpStatusChart";
import QuickActions from "./QuickActions";

/** Placeholder with the same size as the chart, shown while it loads. */
function ChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <p className="sr-only" role="status">
        Loading follow-up status…
      </p>
      <Skeleton circle className="h-32 w-32 shrink-0" />
      <div className="flex w-full flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

export default function FollowUpStatusCard() {
  return (
    <Card
      title="Follow-up Status"
      icon={<ChartPie size={20} strokeWidth={1.75} aria-hidden="true" />}
    >
      <Suspense fallback={<ChartSkeleton />}>
        <FollowUpStatusChart />
      </Suspense>

      <h3 className="mt-8 mb-3 text-sm font-medium text-ink">Quick Actions</h3>
      <QuickActions />
    </Card>
  );
}
