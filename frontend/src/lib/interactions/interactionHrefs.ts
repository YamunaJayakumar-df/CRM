// Links to the Log / Edit interaction pages, built in one place.
//
// Why: many screens link here (the Interactions page, Kanban columns, the
// customer panel, the dashboard). Building the URLs in one place, with
// URLSearchParams doing the encoding, keeps them consistent.
import { buildQueryString } from "@/lib/api/buildQueryString";
import type { InteractionType } from "@/lib/api/types";

/** What the Log interaction page can be opened with. All optional. */
export type NewInteractionOptions = {
  /** Preselect this customer. */
  customerId?: number;
  /** Preselect this type. */
  type?: InteractionType;
  /** Where to go after saving or cancelling (checked by the page). */
  returnTo?: string;
};

/**
 * The "Log interaction" page.
 * Example: newInteractionHref({ customerId: 12, type: "MEETING", returnTo: "/customers/12" })
 *   -> "/interactions/new?customerId=12&type=MEETING&returnTo=%2F%3Fcustomer%3D12"
 */
export function newInteractionHref(options: NewInteractionOptions = {}): string {
  return `/interactions/new${buildQueryString({
    customerId: options.customerId,
    type: options.type,
    returnTo: options.returnTo,
  })}`;
}

/**
 * The "Edit interaction" page.
 * Example: interactionEditHref(5, "/interactions") -> "/interactions/5/edit?returnTo=%2Finteractions"
 */
export function interactionEditHref(interactionId: number, returnTo?: string): string {
  return `/interactions/${interactionId}/edit${buildQueryString({ returnTo })}`;
}
