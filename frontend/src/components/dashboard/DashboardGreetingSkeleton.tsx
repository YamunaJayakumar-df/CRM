// DashboardGreetingSkeleton: what the dashboard header shows for the split
// second before DashboardGreeting knows the time of day. Same size and
// layout as the real header (the subtitle is real text already), so nothing
// jumps when the greeting appears.
import Skeleton from "@/components/Skeleton";

/** Shared with DashboardGreeting so both always show the same subtitle. */
export const DASHBOARD_SUBTITLE = "Here's what's happening with your customers today.";

export default function DashboardGreetingSkeleton() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Skeleton className="h-8 w-56" />
        <p className="mt-1 text-base text-muted">{DASHBOARD_SUBTITLE}</p>
      </div>
      <Skeleton className="h-5 w-36" />
    </div>
  );
}
