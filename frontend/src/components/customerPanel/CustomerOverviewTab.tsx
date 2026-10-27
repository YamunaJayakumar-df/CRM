// CustomerOverviewTab: the default tab of the customer panel: contact
// details, the latest interactions, and the next open follow-ups. Each list
// has a "View all" link to the full page, filtered to this customer.
// The "View all" link is hidden when the list is empty (nothing to see).
// Interaction History also has "+ Log" to log one for this customer.
import ViewAllLink from "@/components/ViewAllLink";
import type { Customer, FollowUp, Interaction } from "@/lib/api/types";
import ContactInfo from "./ContactInfo";
import CustomerFollowUpList from "./CustomerFollowUpList";
import InteractionTimeline from "./InteractionTimeline";
import LogInteractionLink from "./LogInteractionLink";
import PanelSection from "./PanelSection";

type CustomerOverviewTabProps = {
  customer: Customer;
  /** The latest few interactions. */
  interactions: Interaction[];
  /** The next few OPEN follow-ups. */
  openFollowUps: FollowUp[];
  /** Today in India, "YYYY-MM-DD". */
  today: string;
  /** The current dashboard URL (panel open), for the Log and Edit links. */
  returnTo: string;
};

export default function CustomerOverviewTab({
  customer,
  interactions,
  openFollowUps,
  today,
  returnTo,
}: CustomerOverviewTabProps) {
  return (
    <div className="flex flex-col gap-8">
      <ContactInfo customer={customer} />

      <PanelSection
        title="Interaction History"
        action={
          <div className="flex items-center gap-4">
            <LogInteractionLink customerId={customer.id} returnTo={returnTo} />
            {interactions.length > 0 && (
              <ViewAllLink href={`/interactions?customerId=${customer.id}`} />
            )}
          </div>
        }
      >
        <InteractionTimeline interactions={interactions} returnTo={returnTo} />
      </PanelSection>

      <PanelSection
        title="Follow-ups"
        action={
          openFollowUps.length > 0 && <ViewAllLink href={`/follow-ups?customerId=${customer.id}`} />
        }
      >
        <CustomerFollowUpList
          followUps={openFollowUps}
          today={today}
          emptyMessage="No open follow-ups"
        />
      </PanelSection>
    </div>
  );
}
