// Links to the customer pages, built in one place.
//
// Why: several screens link to "edit this customer" or to the customer list
// with a search. Building those URLs here (with URLSearchParams doing the
// encoding) keeps them consistent and avoids gluing user text into URLs.
import { buildQueryString } from "@/lib/api/buildQueryString";
import type { CustomerTab } from "@/lib/dashboard/customerPanelView";
import { firstValue, type SearchParamValue } from "@/lib/dashboard/followUpView";

/** Longest search text we pass on to the backend (its limit is 100 too). */
const MAX_SEARCH_LENGTH = 100;

/** The Customers page's URL search params, as Next.js gives them. */
export type CustomersSearchParams = Record<string, SearchParamValue>;

/** The search text in the URL (?q=...), trimmed, at most 100 characters. Missing -> "". */
export function readCustomerSearch(value: SearchParamValue): string {
  return (firstValue(value) ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
}

/**
 * The Customers page, optionally with a search.
 * Example: customersListHref("R&D") -> "/customers?q=R%26D"; customersListHref("") -> "/customers"
 */
export function customersListHref(search: string): string {
  return `/customers${buildQueryString({ q: search })}`;
}

/**
 * A customer's own page, optionally on one tab. The Overview tab is the
 * default, so it is left out of the URL.
 * Example: customerPageHref(34) -> "/customers/34";
 *          customerPageHref(34, "notes") -> "/customers/34?tab=notes"
 */
export function customerPageHref(customerId: number, tab: CustomerTab = "overview"): string {
  return `/customers/${customerId}${buildQueryString({
    tab: tab === "overview" ? undefined : tab,
  })}`;
}

/** The "Add customer" page. */
export const NEW_CUSTOMER_HREF = "/customers/new";

/**
 * The "Edit customer" page. `returnTo` is where to go after saving or
 * cancelling (the page checks it is a safe internal path before using it).
 * Example: customerEditHref(12, "/customers") -> "/customers/12/edit?returnTo=%2Fcustomers"
 */
export function customerEditHref(customerId: number, returnTo?: string): string {
  return `/customers/${customerId}/edit${buildQueryString({ returnTo })}`;
}
