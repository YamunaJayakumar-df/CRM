// Dashboard (/): the first screen after opening the CRM.
//
// How it loads (Next 16 with cacheComponents):
// - This page component is NOT async and awaits nothing, so Next.js can
//   prebuild its frame (card titles, quick actions, grey placeholders) and
//   send it instantly.
// - Each part that needs live data (the greeting needs the clock; the
//   others need the backend) is its own async component inside <Suspense>.
//   Each streams in on its own, so one slow backend call does not hold up
//   the rest of the page.
// - `searchParams` (the ?fu=...&fq=... filter) is a Promise. We pass it down
//   unopened and only await it inside the follow-ups card's Suspense
//   boundary, so reading the URL does not hold up the rest of the page.
// - Clicking a customer opens their own page (/customers/12).
// - If the backend cannot be reached, app/error.tsx shows a friendly
//   message with a "Try again" button.
import { Suspense } from "react";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import DashboardGreetingSkeleton from "@/components/dashboard/DashboardGreetingSkeleton";
import FollowUpStatusCard from "@/components/dashboard/FollowUpStatusCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import StatCards from "@/components/dashboard/StatCards";
import StatCardsSkeleton from "@/components/dashboard/StatCardsSkeleton";
import UpcomingFollowUps from "@/components/dashboard/UpcomingFollowUps";

export default function DashboardPage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <Suspense fallback={<DashboardGreetingSkeleton />}>
        <DashboardGreeting />
      </Suspense>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      <div className="mt-8">
        <UpcomingFollowUps searchParams={searchParams} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentActivity />
        <FollowUpStatusCard />
      </div>
    </>
  );
}
