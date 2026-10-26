// CustomerInteractionsTab: the "Interactions" tab of the customer panel:
// a longer timeline (up to 20) of this customer's interactions, newest first.
import ViewAllLink from "@/components/ViewAllLink";
import type { Interaction } from "@/lib/api/types";
import InteractionTimeline from "./InteractionTimeline";
import PanelSection from "./PanelSection";

type CustomerInteractionsTabProps = {
  customerId: number;
  interactions: Interaction[];
};

export default function CustomerInteractionsTab({
  customerId,
  interactions,
}: CustomerInteractionsTabProps) {
  return (
    <PanelSection
      title="Interactions"
      action={
        interactions.length > 0 && <ViewAllLink href={`/interactions?customerId=${customerId}`} />
      }
    >
      <InteractionTimeline interactions={interactions} />
    </PanelSection>
  );
}
