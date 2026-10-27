// CustomerInteractionsTab: the "Interactions" tab of the customer panel:
// a longer timeline (up to 20) of this customer's interactions, newest first,
// with "+ Log" and "View all" in the header.
import ViewAllLink from "@/components/ViewAllLink";
import type { Interaction } from "@/lib/api/types";
import InteractionTimeline from "./InteractionTimeline";
import LogInteractionLink from "./LogInteractionLink";
import PanelSection from "./PanelSection";

type CustomerInteractionsTabProps = {
  customerId: number;
  interactions: Interaction[];
  /** The current dashboard URL (panel open), for the Log and Edit links. */
  returnTo: string;
};

export default function CustomerInteractionsTab({
  customerId,
  interactions,
  returnTo,
}: CustomerInteractionsTabProps) {
  return (
    <PanelSection
      title="Interactions"
      action={
        <div className="flex items-center gap-4">
          <LogInteractionLink customerId={customerId} returnTo={returnTo} />
          {interactions.length > 0 && (
            <ViewAllLink href={`/interactions?customerId=${customerId}`} />
          )}
        </div>
      }
    >
      <InteractionTimeline interactions={interactions} returnTo={returnTo} />
    </PanelSection>
  );
}
