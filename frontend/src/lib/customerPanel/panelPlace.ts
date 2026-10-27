// Where the customer side panel is shown: which page, and which of that
// page's filters to keep in its links.
//
// Why: the same panel opens on several pages (Dashboard, Customers,
// Interactions, Follow-ups). Its links (open, Back, tabs, "come back here
// after Edit") must stay on the page the user is on and keep that page's
// filters, e.g. /interactions?view=table&q=acme&customer=12&tab=notes.
// Each page describes itself as a PanelPlace; the panel builds every link
// from it, so the panel itself never needs to know which page it is on.
//
// ?customer=12 opens the panel. It is NOT the same as ?customerId=12, which
// the Interactions and Follow-ups pages use to show only one customer's rows.
import { buildQueryString } from "@/lib/api/buildQueryString";
import type { SearchParamValue } from "@/lib/dashboard/followUpView";
import type { CustomerTab } from "@/lib/dashboard/customerPanelView";

/** A page's URL search params, as Next.js gives them. */
export type PageSearchParams = Record<string, SearchParamValue>;

export type PanelPlace = {
  /** The page's path, e.g. "/" or "/interactions". */
  path: string;
  /**
   * The page's own filters to keep, in URL order, e.g. { view: "table", q: "acme" }.
   * undefined or blank values are left out of the links.
   */
  keep: Record<string, string | undefined>;
};

/** Turns a page's URL search params into its PanelPlace (one per page). */
export type PanelPlaceReader = (params: PageSearchParams) => PanelPlace;

/**
 * The link that opens a customer's panel on this page, keeping its filters.
 * The "overview" tab is the default, so it is left out.
 * Example: customerPanelLink({ path: "/interactions", keep: { q: "acme" } }, 12, "notes")
 *   -> "/interactions?q=acme&customer=12&tab=notes"
 */
export function customerPanelLink(
  place: PanelPlace,
  customerId: number,
  tab: CustomerTab = "overview",
): string {
  return `${place.path}${buildQueryString({
    ...place.keep,
    customer: customerId,
    tab: tab === "overview" ? undefined : tab,
  })}`;
}

/**
 * The same page with the panel closed (the panel's Back link), keeping its filters.
 * Example: closePanelLink({ path: "/interactions", keep: { q: "acme" } }) -> "/interactions?q=acme"
 */
export function closePanelLink(place: PanelPlace): string {
  return `${place.path}${buildQueryString(place.keep)}`;
}
