// CustomerOverview: the first tab of a customer's page.
//   Left:  contact details, industry and the start of the notes.
//   Right: open follow-ups and the latest interactions.
// Each block's "View all" switches to its own tab on this page.
// On narrow screens the two columns stack (details first).
import Card from "@/components/Card";
import ViewAllLink from "@/components/ViewAllLink";
import CustomerContactLines from "@/components/customerPage/CustomerContactLines";
import CustomerFollowUpList from "@/components/customerPage/CustomerFollowUpList";
import InteractionTimeline from "@/components/customerPage/InteractionTimeline";
import LogInteractionLink from "@/components/customerPage/LogInteractionLink";
import type { Customer, FollowUp, Interaction } from "@/lib/api/types";
import { customerPageHref } from "@/lib/customers/customerHrefs";

type CustomerOverviewProps = {
  customer: Customer;
  /** The latest few interactions, newest first. */
  interactions: Interaction[];
  /** The OPEN follow-ups, soonest due first. */
  openFollowUps: FollowUp[];
  /** Today in India, "YYYY-MM-DD". */
  today: string;
  /** This page, for the Edit and Log links to come back to. */
  returnTo: string;
};

export default function CustomerOverview({
  customer,
  interactions,
  openFollowUps,
  today,
  returnTo,
}: CustomerOverviewProps) {
  const notes = (customer.notes ?? "").trim();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6">
        <Card title="Contact details">
          <CustomerContactLines customer={customer} />
        </Card>
        <Card
          title="Notes"
          action={notes !== "" && <ViewAllLink href={customerPageHref(customer.id, "notes")} />}
        >
          {notes !== "" ? (
            // Up to 6 lines here; the Notes tab shows everything.
            <p className="line-clamp-6 text-sm whitespace-pre-line break-words text-ink">{notes}</p>
          ) : (
            <p className="text-sm text-muted">No notes yet.</p>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card
          title="Open follow-ups"
          action={
            openFollowUps.length > 0 && (
              <ViewAllLink href={customerPageHref(customer.id, "follow-ups")} />
            )
          }
        >
          <CustomerFollowUpList
            followUps={openFollowUps}
            today={today}
            emptyMessage="No open follow-ups"
            returnTo={returnTo}
          />
        </Card>
        <Card
          title="Recent interactions"
          action={
            <div className="flex items-center gap-4">
              <LogInteractionLink customerId={customer.id} returnTo={returnTo} />
              {interactions.length > 0 && (
                <ViewAllLink href={customerPageHref(customer.id, "interactions")} />
              )}
            </div>
          }
        >
          <InteractionTimeline interactions={interactions} returnTo={returnTo} />
        </Card>
      </div>
    </div>
  );
}
