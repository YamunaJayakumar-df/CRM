// CustomerPanelContent: loads one customer and shows the customer card.
//
// The card has two kinds of view, chosen by ?tab= in the URL:
//   - no tab ("overview")  -> CustomerSummary: name, contact details,
//                             section links and quick actions (short)
//   - interactions / follow-ups / notes -> CustomerSectionView: "← back to
//                             summary" and that section's full list
//
// Async Server Component, rendered inside <Suspense> by CustomerPanel.
// All backend requests start AT THE SAME TIME (Promise.all). Each view only
// asks for what it shows: the summary needs just the LATEST interaction
// (for "Last contact ..."), the Notes section loads no lists at all.
// The open follow-ups are always loaded, because the summary's
// "Follow-ups: 3 open" needs their count.
// getCustomer returns null for an unknown id -> "Customer not found".
// Other backend failures go to app/error.tsx ("Try again").
import { listFollowUps, listInteractions, getCustomer } from "@/lib/api/queries";
import type { FollowUp, Interaction } from "@/lib/api/types";
import { customerPanelLink, type PanelPlace } from "@/lib/customerPanel/panelPlace";
import { followUpsHint, interactionsHint, notesHint } from "@/lib/customerPanel/sectionHints";
import type { CustomerTab } from "@/lib/dashboard/customerPanelView";
import { todayInKolkata } from "@/lib/format/dates";
import CustomerFollowUpsTab from "./CustomerFollowUpsTab";
import CustomerInteractionsTab from "./CustomerInteractionsTab";
import CustomerNotesTab from "./CustomerNotesTab";
import CustomerNotFound from "./CustomerNotFound";
import CustomerSectionView from "./CustomerSectionView";
import CustomerSummary from "./CustomerSummary";

/** How many rows the Interactions and Follow-ups sections show. */
const SECTION_ROWS = 20;

type CustomerPanelContentProps = {
  customerId: number;
  tab: CustomerTab;
  /** The page the card is on, and the filters its links keep. */
  place: PanelPlace;
  /** This page without the card (the ✕ button). */
  backHref: string;
};

/** The interactions each view needs: 1 (summary), 20 (Interactions section) or none. */
function loadInteractions(customerId: number, tab: CustomerTab): Promise<Interaction[]> {
  if (tab === "overview") {
    return listInteractions({ customerId, limit: 1 });
  }
  if (tab === "interactions") {
    return listInteractions({ customerId, limit: SECTION_ROWS });
  }
  return Promise.resolve([]);
}

/** Open AND done follow-ups, only for the Follow-ups section. */
function loadAllFollowUps(customerId: number, tab: CustomerTab): Promise<FollowUp[]> {
  if (tab === "follow-ups") {
    return listFollowUps({ customerId, limit: SECTION_ROWS });
  }
  return Promise.resolve([]);
}

export default async function CustomerPanelContent({
  customerId,
  tab,
  place,
  backHref,
}: CustomerPanelContentProps) {
  const [customer, openFollowUps, interactions, allFollowUps] = await Promise.all([
    getCustomer(customerId),
    // Up to 20 so the count is right for normal customers ("20+" beyond that).
    listFollowUps({ customerId, status: "OPEN", limit: SECTION_ROWS }),
    loadInteractions(customerId, tab),
    loadAllFollowUps(customerId, tab),
  ]);

  if (customer === null) {
    return <CustomerNotFound backHref={backHref} />;
  }

  // This exact view (same page, filters and tab): the forms come back here.
  const viewHref = customerPanelLink(place, customer.id, tab);

  if (tab === "overview") {
    const latest = interactions.at(0);
    return (
      <CustomerSummary
        customer={customer}
        place={place}
        closeHref={backHref}
        returnTo={viewHref}
        sections={[
          {
            tab: "interactions",
            label: "Interactions",
            hint: interactionsHint(latest === undefined ? null : latest.occurredAt),
          },
          {
            tab: "follow-ups",
            label: "Follow-ups",
            hint: followUpsHint(openFollowUps.length, SECTION_ROWS),
          },
          { tab: "notes", label: "Notes", hint: notesHint(customer.notes) },
        ]}
      />
    );
  }

  // Read after the backend calls, so it is always the real "today" (India).
  const today = todayInKolkata(new Date());

  let section: React.ReactNode;
  if (tab === "interactions") {
    section = (
      <CustomerInteractionsTab
        customerId={customer.id}
        interactions={interactions}
        returnTo={viewHref}
      />
    );
  } else if (tab === "follow-ups") {
    section = (
      <CustomerFollowUpsTab
        customerId={customer.id}
        followUps={allFollowUps}
        today={today}
        returnTo={viewHref}
      />
    );
  } else {
    section = <CustomerNotesTab notes={customer.notes} />;
  }

  return (
    <CustomerSectionView
      companyName={customer.companyName}
      summaryHref={customerPanelLink(place, customer.id)}
      closeHref={backHref}
    >
      {section}
    </CustomerSectionView>
  );
}
