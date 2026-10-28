// Shapes a follow-up from the database into the JSON we send to the frontend.
//
// Why: the database gives dueDate as a JavaScript Date at midnight UTC, which
// would be sent as "2026-10-30T00:00:00.000Z". That looks like a moment in time
// and a browser in India could even show it as the wrong day. A due date is a
// plain calendar day, so the frontend gets exactly "2026-10-30".
// Every follow-up route sends its result through toFollowUpResponse.
import type { FollowUp } from "../generated/prisma/client.js";
import type { CustomerSummary } from "../shared/customerSummary.js";
import { dateToPlainDate } from "../shared/plainDate.js";

/** A follow-up as the routes load it: with its small customer summary. */
export type FollowUpWithCustomer = FollowUp & { customer: CustomerSummary };

/**
 * A follow-up as sent to the frontend: the same fields (including `customer`),
 * but dueDate is "YYYY-MM-DD".
 */
export type FollowUpResponse = Omit<FollowUpWithCustomer, "dueDate"> & {
  dueDate: string;
};

/** Convert one follow-up from the database into its response shape. */
export function toFollowUpResponse(
  followUp: FollowUpWithCustomer,
): FollowUpResponse {
  return { ...followUp, dueDate: dateToPlainDate(followUp.dueDate) };
}
