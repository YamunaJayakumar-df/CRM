// CustomerFollowUpsTab: the "Follow-ups" tab of a customer's page: open
// AND done follow-ups (up to 20), soonest due first, with status and
// priority pills.
import ViewAllLink from "@/components/ViewAllLink";
import type { FollowUp } from "@/lib/api/types";
import CustomerFollowUpList from "./CustomerFollowUpList";
import TabSection from "./TabSection";

type CustomerFollowUpsTabProps = {
  customerId: number;
  followUps: FollowUp[];
  /** Today in India, "YYYY-MM-DD". */
  today: string;
  /** This customer page (same tab), for the Edit links. */
  returnTo: string;
};

export default function CustomerFollowUpsTab({
  customerId,
  followUps,
  today,
  returnTo,
}: CustomerFollowUpsTabProps) {
  return (
    <TabSection
      title="All Follow-ups"
      action={followUps.length > 0 && <ViewAllLink href={`/follow-ups?customerId=${customerId}`} />}
    >
      <CustomerFollowUpList
        followUps={followUps}
        today={today}
        emptyMessage="No follow-ups yet"
        showStatus
        returnTo={returnTo}
      />
    </TabSection>
  );
}
