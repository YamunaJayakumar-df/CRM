// FollowUpsPanel: the inside of the "Upcoming Follow-ups" card: filter
// chips, search box, and up to 5 follow-ups.
//
// Async Server Component, rendered inside <Suspense> by UpcomingFollowUps.
// 1. Read ?fu (chip), ?fq (search) and ?customer (open panel) from the URL.
// 2. Ask the backend for the summary (chip counts, today's date) and the
//    matching follow-ups AT THE SAME TIME (Promise.all), not one after another.
// If the backend fails, the error goes to app/error.tsx ("Try again").
import { Inbox, SearchX } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { listFollowUps } from "@/lib/api/queries";
import { getDashboardSummaryOnce } from "@/lib/api/requestMemo";
import {
  customerPanelHref,
  readCustomerId,
  readCustomerTab,
} from "@/lib/dashboard/customerPanelView";
import {
  chipCounts,
  followUpFiltersFor,
  readFollowUpChip,
  followUpViewHref,
  readFollowUpSearch,
  type DashboardSearchParams,
} from "@/lib/dashboard/followUpView";
import FollowUpFilterChips from "./FollowUpFilterChips";
import FollowUpSearchForm from "./FollowUpSearchForm";
import FollowUpTable from "./FollowUpTable";

type FollowUpsPanelProps = {
  searchParams: Promise<DashboardSearchParams>;
};

const emptyIconProps = { size: 28, strokeWidth: 1.5, "aria-hidden": true } as const;

export default async function FollowUpsPanel({ searchParams }: FollowUpsPanelProps) {
  const params = await searchParams;
  const chip = readFollowUpChip(params.fu);
  const search = readFollowUpSearch(params.fq);
  const selectedCustomerId = readCustomerId(params.customer);
  // This exact dashboard view (filter, open panel and its tab), for the
  // row actions to come back to.
  const returnTo =
    selectedCustomerId === null
      ? followUpViewHref(chip, search)
      : customerPanelHref(selectedCustomerId, chip, search, readCustomerTab(params.tab));

  const [summary, followUps] = await Promise.all([
    getDashboardSummaryOnce(),
    listFollowUps(followUpFiltersFor(chip, search)),
  ]);
  const counts = chipCounts(summary.followUps);

  let content: React.ReactNode;
  if (followUps.length > 0) {
    content = (
      <FollowUpTable
        followUps={followUps}
        today={summary.today}
        chip={chip}
        search={search}
        selectedCustomerId={selectedCustomerId}
        returnTo={returnTo}
      />
    );
  } else if (counts.all === 0) {
    // Nothing in the database yet.
    content = (
      <EmptyState
        icon={<Inbox {...emptyIconProps} />}
        message="No follow-ups yet"
        hint="When you plan a call or task for a customer, it will appear here."
      />
    );
  } else {
    // There are follow-ups, just none for this chip or search.
    content = (
      <EmptyState
        icon={<SearchX {...emptyIconProps} />}
        message="No follow-ups match"
        hint="Try another filter or clear the search."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FollowUpFilterChips
          active={chip}
          counts={counts}
          search={search}
          customerId={selectedCustomerId}
        />
        <FollowUpSearchForm chip={chip} search={search} customerId={selectedCustomerId} />
      </div>
      {content}
    </div>
  );
}
