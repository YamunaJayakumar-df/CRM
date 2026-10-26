// CustomerFollowUpsTab: the "Follow-ups" tab of the customer panel: open
// AND done follow-ups (up to 20), soonest due first, with status and
// priority pills.
import ViewAllLink from "@/components/ViewAllLink";
import type { FollowUp } from "@/lib/api/types";
import CustomerFollowUpList from "./CustomerFollowUpList";
import PanelSection from "./PanelSection";

type CustomerFollowUpsTabProps = {
  customerId: number;
  followUps: FollowUp[];
  /** Today in India, "YYYY-MM-DD". */
  today: string;
};

export default function CustomerFollowUpsTab({
  customerId,
  followUps,
  today,
}: CustomerFollowUpsTabProps) {
  return (
    <PanelSection
      title="All Follow-ups"
      action={followUps.length > 0 && <ViewAllLink href={`/follow-ups?customerId=${customerId}`} />}
    >
      <CustomerFollowUpList
        followUps={followUps}
        today={today}
        emptyMessage="No follow-ups yet"
        showStatus
      />
    </PanelSection>
  );
}
