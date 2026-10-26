// Shares ONE dashboard summary between all sections of a single page request.
//
// Why: three dashboard sections need the same summary (stat cards, filter
// chip counts, the status donut). Without this, one page view would call the
// backend three times for identical numbers.
// React's cache() remembers a result only for the CURRENT request. The next
// request (a refresh, another user) asks the backend again, so data stays
// fresh. This is NOT the "use cache" directive (which keeps results across
// requests and must never wrap CRM data, see backendFetch.ts).
import "server-only";
import { cache } from "react";
import { getDashboardSummary } from "./queries";

/** Same as getDashboardSummary(), but called at most once per page request. */
export const getDashboardSummaryOnce = cache(getDashboardSummary);
