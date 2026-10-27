// Reads and writes the customer side panel in the URL.
// (The links for OTHER pages are built in lib/customerPanel/panelPlace.ts.)
//
// Clicking a customer on the dashboard opens a panel with their details.
// Which customer, and which tab of the panel, live in the URL, e.g.
//   /?fu=overdue&fq=acme&customer=12&tab=notes
// Why the URL (and not React state): the page stays a Server Component,
// the links work without JavaScript, and an open panel can be bookmarked or
// shared. The follow-up filter (?fu, ?fq) is always carried along, so
// opening or closing the panel never resets the table the user was looking at.
import {
  customerPanelLink,
  type PanelPlace,
  type PageSearchParams,
} from "@/lib/customerPanel/panelPlace";
import {
  firstValue,
  readFollowUpChip,
  readFollowUpSearch,
  type FollowUpChip,
  type SearchParamValue,
} from "./followUpView";

/** The panel's tabs that can be opened ("files" is not built yet). */
export type CustomerTab = "overview" | "interactions" | "follow-ups" | "notes";

/** Tabs in the order they are shown. */
export const CUSTOMER_TABS: readonly CustomerTab[] = [
  "overview",
  "interactions",
  "follow-ups",
  "notes",
];

// The largest id the database can store (Postgres "integer"). Bigger
// numbers can never be a real customer, and the backend rejects them.
const MAX_CUSTOMER_ID = 2_147_483_647;

/** True when the URL asks for a panel at all (?customer= is present and not blank). */
export function hasCustomerParam(value: SearchParamValue): boolean {
  return (firstValue(value) ?? "").trim() !== "";
}

/**
 * The customer id in the URL (?customer=12), or null if it is not a valid id.
 * Only digits are accepted: "12" -> 12, but "12abc", "-3", "1.5", "0" -> null.
 * We check this BEFORE calling the backend, so odd URLs never reach it.
 */
export function readCustomerId(value: SearchParamValue): number | null {
  const text = firstValue(value) ?? "";
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const id = Number(text);
  if (id <= 0 || id > MAX_CUSTOMER_ID) {
    return null;
  }
  return id;
}

/** The tab in the URL (?tab=...). Anything unknown or missing -> "overview". */
export function readCustomerTab(value: SearchParamValue): CustomerTab {
  const text = firstValue(value);
  return CUSTOMER_TABS.find((tab) => tab === text) ?? "overview";
}

/**
 * The dashboard as a place for the customer panel: path "/" and its
 * follow-up filter (?fu, ?fq). "all" and blank search are left out.
 */
export function dashboardPanelPlace(chip: FollowUpChip, search: string): PanelPlace {
  return {
    path: "/",
    keep: { fu: chip === "all" ? undefined : chip, fq: search },
  };
}

/** The dashboard's panel place, read from its URL search params. */
export function readDashboardPanelPlace(params: PageSearchParams): PanelPlace {
  return dashboardPanelPlace(readFollowUpChip(params.fu), readFollowUpSearch(params.fq));
}

/**
 * The dashboard link that opens a customer's panel, keeping the follow-up
 * filter. "all", blank search and the "overview" tab are left out.
 * Example: customerPanelHref(12, "open", "R&D", "notes")
 *   -> "/?fu=open&fq=R%26D&customer=12&tab=notes"
 */
export function customerPanelHref(
  customerId: number,
  chip: FollowUpChip,
  search: string,
  tab: CustomerTab = "overview",
): string {
  return customerPanelLink(dashboardPanelPlace(chip, search), customerId, tab);
}
