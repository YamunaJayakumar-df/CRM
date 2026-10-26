// The small piece of customer data that is sent along with every
// interaction and follow-up, e.g. so a list can show
// "Acme Corp — Send proposal v2" without a second request.
//
// Why one shared file: interactions and follow-ups both use it, and if the
// frontend later needs one more customer field, it is added here only.
// We pick fields on purpose (instead of sending the whole customer) so
// notes, email and phone are not copied into every row.
import type { Prisma } from "../generated/prisma/client.js";

/** Which customer fields the summary contains. */
export const CUSTOMER_SUMMARY_SELECT = {
  id: true,
  companyName: true,
  website: true,
} satisfies Prisma.CustomerSelect;

/**
 * Pass as `include` to any interaction or follow-up query
 * (findMany, findUnique, create, update) to get `customer` in each row.
 */
export const INCLUDE_CUSTOMER_SUMMARY = {
  customer: { select: CUSTOMER_SUMMARY_SELECT },
} as const;

/** The shape Prisma returns for CUSTOMER_SUMMARY_SELECT. */
export type CustomerSummary = Prisma.CustomerGetPayload<{
  select: typeof CUSTOMER_SUMMARY_SELECT;
}>;
