// CustomerPanelContent: loads one customer and shows their panel: top
// buttons, name and status, quick contact actions, tabs, and the chosen tab.
//
// Async Server Component, rendered inside <Suspense> by CustomerPanel.
// All backend requests start AT THE SAME TIME (Promise.all). Each tab only
// asks for what it shows: e.g. the Notes tab loads no interactions.
// The open follow-ups are always loaded, because the "Follow-ups (n)" tab
// label needs their count.
// getCustomer returns null for an unknown id -> "Customer not found".
// Other backend failures go to app/error.tsx ("Try again"), like the rest
// of the dashboard.
import { listFollowUps, listInteractions, getCustomer } from "@/lib/api/queries";
import type { FollowUp, Interaction } from "@/lib/api/types";
import { customerEditHref } from "@/lib/customers/customerHrefs";
import { customerPanelHref, type CustomerTab } from "@/lib/dashboard/customerPanelView";
import type { FollowUpChip } from "@/lib/dashboard/followUpView";
import { todayInKolkata } from "@/lib/format/dates";
import CustomerActions from "./CustomerActions";
import CustomerFollowUpsTab from "./CustomerFollowUpsTab";
import CustomerIdentity from "./CustomerIdentity";
import CustomerInteractionsTab from "./CustomerInteractionsTab";
import CustomerNotesTab from "./CustomerNotesTab";
import CustomerNotFound from "./CustomerNotFound";
import CustomerOverviewTab from "./CustomerOverviewTab";
import CustomerTabs from "./CustomerTabs";
import PanelTopBar from "./PanelTopBar";

/** How many interactions / follow-ups the Overview tab shows. */
const OVERVIEW_INTERACTIONS = 4;
const OVERVIEW_FOLLOW_UPS = 3;
/** How many rows the Interactions and Follow-ups tabs show. */
const TAB_ROWS = 20;

type CustomerPanelContentProps = {
  customerId: number;
  tab: CustomerTab;
  chip: FollowUpChip;
  search: string;
  backHref: string;
};

/** Interactions for the tabs that show them; no request for the other tabs. */
function loadInteractions(customerId: number, tab: CustomerTab): Promise<Interaction[]> {
  if (tab === "overview") {
    return listInteractions({ customerId, limit: OVERVIEW_INTERACTIONS });
  }
  if (tab === "interactions") {
    return listInteractions({ customerId, limit: TAB_ROWS });
  }
  return Promise.resolve([]);
}

/** Open AND done follow-ups, only for the Follow-ups tab. */
function loadAllFollowUps(customerId: number, tab: CustomerTab): Promise<FollowUp[]> {
  if (tab === "follow-ups") {
    return listFollowUps({ customerId, limit: TAB_ROWS });
  }
  return Promise.resolve([]);
}

export default async function CustomerPanelContent({
  customerId,
  tab,
  chip,
  search,
  backHref,
}: CustomerPanelContentProps) {
  const [customer, openFollowUps, interactions, allFollowUps] = await Promise.all([
    getCustomer(customerId),
    // Up to 20 so the tab count is right for normal customers ("20+" beyond that).
    listFollowUps({ customerId, status: "OPEN", limit: TAB_ROWS }),
    loadInteractions(customerId, tab),
    loadAllFollowUps(customerId, tab),
  ]);

  if (customer === null) {
    return <CustomerNotFound backHref={backHref} />;
  }

  // Read after the backend calls, so it is always the real "today" (India).
  const today = todayInKolkata(new Date());

  let tabContent: React.ReactNode;
  if (tab === "interactions") {
    tabContent = <CustomerInteractionsTab customerId={customer.id} interactions={interactions} />;
  } else if (tab === "follow-ups") {
    tabContent = (
      <CustomerFollowUpsTab customerId={customer.id} followUps={allFollowUps} today={today} />
    );
  } else if (tab === "notes") {
    tabContent = <CustomerNotesTab notes={customer.notes} />;
  } else {
    tabContent = (
      <CustomerOverviewTab
        customer={customer}
        interactions={interactions}
        openFollowUps={openFollowUps.slice(0, OVERVIEW_FOLLOW_UPS)}
        today={today}
      />
    );
  }

  return (
    <div>
      <PanelTopBar
        backHref={backHref}
        // After editing, come back to exactly this view (same filter and tab).
        editHref={customerEditHref(customer.id, customerPanelHref(customer.id, chip, search, tab))}
      />
      <CustomerIdentity customer={customer} />
      <CustomerActions customer={customer} />
      <CustomerTabs
        customerId={customer.id}
        active={tab}
        chip={chip}
        search={search}
        openFollowUpCount={openFollowUps.length}
        countLimit={TAB_ROWS}
      />
      <div className="mt-6">{tabContent}</div>
    </div>
  );
}
