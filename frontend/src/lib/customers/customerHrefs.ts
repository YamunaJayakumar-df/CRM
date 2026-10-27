// Links to the customer pages, built in one place.
//
// Why: several screens link to "edit this customer" or to the customer list
// with a search. Building those URLs here (with URLSearchParams doing the
// encoding) keeps them consistent and avoids gluing user text into URLs.
import { buildQueryString } from "@/lib/api/buildQueryString";
import type { PageSearchParams, PanelPlace } from "@/lib/customerPanel/panelPlace";
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
 * The Customers page as a place for the customer side panel: path
 * "/customers", keeping the search. Opening a customer from the list then
 * stays on this page, e.g. /customers?q=acme&customer=12.
 */
export function customersPanelPlace(search: string): PanelPlace {
  return { path: "/customers", keep: { q: search } };
}

/** The Customers page's panel place, read from its URL search params. */
export function readCustomersPanelPlace(params: PageSearchParams): PanelPlace {
  return customersPanelPlace(readCustomerSearch(params.q));
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
