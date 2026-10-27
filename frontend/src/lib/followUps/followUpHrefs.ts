// Links to the New / Edit follow-up pages, built in one place.
//
// Why: many screens link here (the Follow-ups page, the dashboard table,
// Quick Actions, the customer panel). Building the URLs in one place, with
// URLSearchParams doing the encoding, keeps them consistent.
import { buildQueryString } from "@/lib/api/buildQueryString";

/** What the New follow-up page can be opened with. All optional. */
export type NewFollowUpOptions = {
  /** Preselect this customer. */
  customerId?: number;
  /** Where to go after saving or cancelling (checked by the page). */
  returnTo?: string;
};

/**
 * The "New follow-up" page.
 * Example: newFollowUpHref({ customerId: 12, returnTo: "/customers/12" })
 *   -> "/follow-ups/new?customerId=12&returnTo=%2F%3Fcustomer%3D12"
 */
export function newFollowUpHref(options: NewFollowUpOptions = {}): string {
  return `/follow-ups/new${buildQueryString({
    customerId: options.customerId,
    returnTo: options.returnTo,
  })}`;
}

/**
 * The "Edit follow-up" page.
 * Example: followUpEditHref(5, "/follow-ups") -> "/follow-ups/5/edit?returnTo=%2Ffollow-ups"
 */
export function followUpEditHref(followUpId: number, returnTo?: string): string {
  return `/follow-ups/${followUpId}/edit${buildQueryString({ returnTo })}`;
}
