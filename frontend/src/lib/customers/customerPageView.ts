// Reads a customer id and a customer page tab from the URL.
//
// readCustomerId is used wherever an id arrives as text (a page address
// like /customers/12, a ?customerId= filter, or a hidden form field), so
// odd values are rejected BEFORE they reach the backend.
// readCustomerTab reads ?tab= on a customer's page (/customers/12?tab=notes).
import { firstValue, type SearchParamValue } from "@/lib/dashboard/followUpView";

/** The tabs of a customer's page ("files" is not built yet). */
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

/**
 * A customer id read from the URL (e.g. "12"), or null if it is not a valid id.
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
