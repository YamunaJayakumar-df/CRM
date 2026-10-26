// RecentActivity: the "Recent Activity" card on the dashboard.
// The card frame (title, icon, "View all") shows at once; the list needs
// the backend, so it is in RecentActivityList inside <Suspense>.
import { Suspense } from "react";
import { Activity } from "lucide-react";
import Card from "@/components/Card";
import ViewAllLink from "@/components/ViewAllLink";
import ListSkeleton from "./ListSkeleton";
import RecentActivityList, { RECENT_ACTIVITY_ROWS } from "./RecentActivityList";

export default function RecentActivity() {
  return (
    <Card
      title="Recent Activity"
      icon={<Activity size={20} strokeWidth={1.75} aria-hidden="true" />}
      action={<ViewAllLink href="/interactions" />}
    >
      <Suspense fallback={<ListSkeleton label="Loading recent activity…" rows={RECENT_ACTIVITY_ROWS} />}>
        <RecentActivityList />
      </Suspense>
    </Card>
  );
}
