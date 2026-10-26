// StatCards: the four number boxes at the top of the dashboard, filled
// from the backend's dashboard summary.
//
// Async Server Component: it waits for the backend, so the page wraps it in
// <Suspense> (with StatCardsSkeleton) and the rest of the page does not wait.
// If the backend is down, the error goes to app/error.tsx ("Try again").
import { CalendarCheck, MessagesSquare, TriangleAlert, Users } from "lucide-react";
import Sparkline from "@/components/Sparkline";
import StatCard from "@/components/StatCard";
import { getDashboardSummaryOnce } from "@/lib/api/requestMemo";
import { weekChange } from "@/lib/format/trend";
import TrendText from "./TrendText";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export default async function StatCards() {
  const { customers, followUps, interactions } = await getDashboardSummaryOnce();
  const interactionChange = weekChange(interactions.last7Days, interactions.previous7Days);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Customers"
        value={customers.total}
        icon={<Users {...iconProps} />}
        trend={<TrendText direction="up" amount={customers.addedLast7Days} suffix="this week" />}
        chart={<Sparkline values={customers.dailyNew} color="blue" />}
      />
      <StatCard
        // "Open" includes overdue follow-ups: they are still open.
        label="Open Follow-ups"
        value={followUps.open}
        icon={<CalendarCheck {...iconProps} />}
        trend={`${followUps.dueNext7Days} due this week`}
        chart={<Sparkline values={followUps.dueByDayNext14} color="blue" />}
      />
      <StatCard
        label="Overdue Tasks"
        value={followUps.overdue}
        tone="red"
        icon={<TriangleAlert {...iconProps} />}
        trend={`${followUps.dueToday} due today`}
        chart={<Sparkline values={followUps.overdueByDayLast14} color="red" />}
      />
      <StatCard
        label="Recent Interactions"
        value={interactions.last7Days}
        icon={<MessagesSquare {...iconProps} />}
        trend={
          interactionChange.direction === "same" ? (
            "Same as last week"
          ) : (
            <TrendText
              direction={interactionChange.direction}
              amount={interactionChange.amount}
              suffix="vs last week"
            />
          )
        }
        chart={<Sparkline values={interactions.dailyCount} color="blue" />}
      />
    </div>
  );
}
