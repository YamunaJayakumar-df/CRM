// UpcomingFollowUps: the "Upcoming Follow-ups" card on the dashboard.
//
// This outer part (title, icon, "View all") needs no data, so it is shown
// at once. The chips, search and table inside need the backend AND the URL,
// so they live in FollowUpsPanel inside <Suspense>.
// `searchParams` is passed down still as a Promise (not awaited here): in
// Next 16 awaiting it marks everything after it as "per request", so we
// await it as deep as possible, inside the Suspense boundary.
import { Suspense } from "react";
import { CalendarCheck } from "lucide-react";
import Card from "@/components/Card";
import ViewAllLink from "@/components/ViewAllLink";
import FollowUpsPanel, { type DashboardSearchParams } from "./FollowUpsPanel";
import FollowUpsPanelSkeleton from "./FollowUpsPanelSkeleton";

type UpcomingFollowUpsProps = {
  searchParams: Promise<DashboardSearchParams>;
};

export default function UpcomingFollowUps({ searchParams }: UpcomingFollowUpsProps) {
  return (
    <Card
      title="Upcoming Follow-ups"
      icon={<CalendarCheck size={20} strokeWidth={1.75} aria-hidden="true" />}
      action={<ViewAllLink href="/follow-ups" />}
    >
      <Suspense fallback={<FollowUpsPanelSkeleton />}>
        <FollowUpsPanel searchParams={searchParams} />
      </Suspense>
    </Card>
  );
}
