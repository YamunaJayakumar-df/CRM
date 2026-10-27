// CustomerPageContent: loads one customer and shows their page: header,
// tab row, and the chosen tab (?tab=, default Overview).
//
// Async Server Component, rendered inside <Suspense> by the page.
// - The id is checked BEFORE calling the backend ("abc", "0" -> not found);
//   an unknown customer also calls notFound(), which shows ../not-found.tsx.
// - All backend requests start AT THE SAME TIME (Promise.all). Each tab only
//   asks for what it shows: e.g. the Notes tab loads no interactions.
//   The open follow-ups are always loaded, because the "Follow-ups (n)" tab
//   label needs their count.
// - Other backend failures go to app/error.tsx ("Try again").
import { notFound } from "next/navigation";
import Card from "@/components/Card";
import CustomerFollowUpsTab from "@/components/customerPanel/CustomerFollowUpsTab";
import CustomerInteractionsTab from "@/components/customerPanel/CustomerInteractionsTab";
import CustomerNotesTab from "@/components/customerPanel/CustomerNotesTab";
import { getCustomer, listFollowUps, listInteractions } from "@/lib/api/queries";
import type { FollowUp, Interaction } from "@/lib/api/types";
import { customerPageHref } from "@/lib/customers/customerHrefs";
import { readCustomerId, readCustomerTab, type CustomerTab } from "@/lib/dashboard/customerPanelView";
import type { SearchParamValue } from "@/lib/dashboard/followUpView";
import { todayInKolkata } from "@/lib/format/dates";
import CustomerOverview from "./CustomerOverview";
import CustomerPageHeader from "./CustomerPageHeader";
import CustomerPageTabs from "./CustomerPageTabs";

/** How many interactions the Overview tab shows. */
const OVERVIEW_INTERACTIONS = 5;
/** How many rows the Interactions and Follow-ups tabs (and the open count) load. */
const TAB_ROWS = 20;

type CustomerPageContentProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
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

export default async function CustomerPageContent({ params, searchParams }: CustomerPageContentProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  const customerId = readCustomerId(id);
  if (customerId === null) {
    notFound();
  }
  const tab = readCustomerTab(query.tab);

  const [customer, openFollowUps, interactions, allFollowUps] = await Promise.all([
    getCustomer(customerId),
    listFollowUps({ customerId, status: "OPEN", limit: TAB_ROWS }),
    loadInteractions(customerId, tab),
    loadAllFollowUps(customerId, tab),
  ]);
  if (customer === null) {
    notFound();
  }

  // Read after the backend calls, so it is always the real "today" (India).
  const today = todayInKolkata(new Date());
  // This exact page and tab: the forms come back here after saving.
  const returnTo = customerPageHref(customer.id, tab);
  const openCountText =
    openFollowUps.length >= TAB_ROWS ? `${TAB_ROWS}+` : String(openFollowUps.length);

  let tabContent: React.ReactNode;
  if (tab === "interactions") {
    tabContent = (
      <Card>
        <CustomerInteractionsTab
          customerId={customer.id}
          interactions={interactions}
          returnTo={returnTo}
        />
      </Card>
    );
  } else if (tab === "follow-ups") {
    tabContent = (
      <Card>
        <CustomerFollowUpsTab
          customerId={customer.id}
          followUps={allFollowUps}
          today={today}
          returnTo={returnTo}
        />
      </Card>
    );
  } else if (tab === "notes") {
    tabContent = (
      <Card>
        <CustomerNotesTab notes={customer.notes} />
      </Card>
    );
  } else {
    tabContent = (
      <CustomerOverview
        customer={customer}
        interactions={interactions}
        openFollowUps={openFollowUps}
        today={today}
        returnTo={returnTo}
      />
    );
  }

  return (
    <>
      <CustomerPageHeader customer={customer} returnTo={returnTo} />
      <CustomerPageTabs customerId={customer.id} active={tab} openFollowUpCountText={openCountText} />
      {tabContent}
    </>
  );
}
