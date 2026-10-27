// Reads and writes the Follow-ups page's filters in the URL.
//
// The page's state lives in the URL, e.g.
//   /follow-ups?view=overdue&q=renewal&customerId=12
// Why the URL (and not React state): the page stays a Server Component,
// every control is a plain link or GET form that works without JavaScript,
// and a filtered view can be bookmarked or shared (the bell links to
// ?view=overdue, the customer panel's "View all" to ?customerId=12).
// Defaults are left OUT of links (Open, no search, no customer), so the
// plain view is just "/follow-ups". Anything unknown falls back to the default.
import type { FollowUpFilters } from "@/lib/api/queries";
import { buildQueryString } from "@/lib/api/buildQueryString";
import { readCustomerId } from "@/lib/customers/customerPageView";
import { firstValue, type SearchParamValue } from "@/lib/dashboard/followUpView";

/** The view chips. */
export type FollowUpsView = "today" | "overdue" | "open" | "done" | "all";

/** Everything the page reads from its URL. */
export type FollowUpsState = {
  view: FollowUpsView;
  /** Search text, trimmed; "" = no search. */
  search: string;
  /** Only this customer's follow-ups; null = every customer. */
  customerId: number | null;
};

/** The Follow-ups page's URL search params, as Next.js gives them. */
export type FollowUpsSearchParams = Record<string, SearchParamValue>;

/** Views in the order the chips show them. */
export const FOLLOW_UPS_VIEWS: readonly FollowUpsView[] = ["today", "overdue", "open", "done", "all"];

export const FOLLOW_UPS_VIEW_LABELS: Record<FollowUpsView, string> = {
  today: "Due today",
  overdue: "Overdue",
  open: "Open",
  done: "Done",
  all: "All",
};

/** What the page shows when the URL says nothing. */
export const DEFAULT_FOLLOW_UPS_STATE: FollowUpsState = {
  view: "open",
  search: "",
  customerId: null,
};

/** How many rows the page loads at most (the backend allows up to 500). */
export const FOLLOW_UPS_PAGE_LIMIT = 200;

/** Longest search text we pass on (the backend allows 100 characters). */
const MAX_SEARCH_LENGTH = 100;

/** ?view=today|overdue|open|done|all. Anything else -> "open". */
export function readFollowUpsView(value: SearchParamValue): FollowUpsView {
  const text = firstValue(value);
  return FOLLOW_UPS_VIEWS.find((view) => view === text) ?? DEFAULT_FOLLOW_UPS_STATE.view;
}

/** Reads the whole page state from the URL. ?customerId must be digits, or it is ignored. */
export function readFollowUpsState(params: FollowUpsSearchParams): FollowUpsState {
  return {
    view: readFollowUpsView(params.view),
    search: (firstValue(params.q) ?? "").trim().slice(0, MAX_SEARCH_LENGTH),
    customerId: readCustomerId(params.customerId),
  };
}

/**
 * The page link for a state, leaving defaults out.
 * Pass the current state with one field changed, e.g.
 *   followUpsHref({ ...state, view: "done" })
 * Example: { view: "overdue", search: "R&D", customerId: 12 }
 *   -> "/follow-ups?view=overdue&q=R%26D&customerId=12"
 */
export function followUpsHref(state: FollowUpsState): string {
  return `/follow-ups${buildQueryString({
    view: state.view === DEFAULT_FOLLOW_UPS_STATE.view ? undefined : state.view,
    q: state.search,
    customerId: state.customerId ?? undefined,
  })}`;
}

/**
 * The backend filters for a state:
 * today -> due=today, overdue -> due=overdue, open -> status=OPEN,
 * done -> status=DONE, all -> no status or due filter.
 * (The backend's "today" and "overdue" only ever include OPEN follow-ups.)
 */
export function followUpsFiltersFor(state: FollowUpsState, limit: number): FollowUpFilters {
  const filters: FollowUpFilters = {
    q: state.search === "" ? undefined : state.search,
    customerId: state.customerId ?? undefined,
    limit,
  };
  switch (state.view) {
    case "today":
      return { ...filters, due: "today" };
    case "overdue":
      return { ...filters, due: "overdue" };
    case "open":
      return { ...filters, status: "OPEN" };
    case "done":
      return { ...filters, status: "DONE" };
    default:
      return filters;
  }
}

/**
 * A short text that changes whenever the list must be loaded again.
 * Used as a Suspense `key`, so new filters show the loading skeleton
 * instead of the old results.
 */
export function followUpsStateKey(state: FollowUpsState): string {
  return followUpsHref(state);
}

/** Message + hint for the page's empty state, depending on what is filtered. */
export function followUpsEmptyText(state: FollowUpsState): { message: string; hint: string } {
  if (state.search !== "" || state.customerId !== null) {
    return {
      message: "No follow-ups match",
      hint: "Try another search, another view, or remove the customer filter.",
    };
  }
  switch (state.view) {
    case "today":
      return { message: "Nothing due today", hint: "You are all caught up for today." };
    case "overdue":
      return { message: "Nothing overdue", hint: "Every open follow-up is on time." };
    case "open":
      return {
        message: "No open follow-ups",
        hint: "Plan a call or task for a customer with New follow-up.",
      };
    case "done":
      return { message: "Nothing done yet", hint: "Follow-ups you mark as done will appear here." };
    default:
      return {
        message: "No follow-ups yet",
        hint: "Plan a call or task for a customer with New follow-up.",
      };
  }
}

/**
 * Where the top bar's bell goes: the most urgent list first.
 * Overdue ones -> the Overdue view; else due today -> Due today; else Open.
 * Example: dueFollowUpsHref({ overdue: 0, dueToday: 2 }) -> "/follow-ups?view=today"
 */
export function dueFollowUpsHref(counts: { overdue: number; dueToday: number }): string {
  if (counts.overdue > 0) {
    return followUpsHref({ ...DEFAULT_FOLLOW_UPS_STATE, view: "overdue" });
  }
  if (counts.dueToday > 0) {
    return followUpsHref({ ...DEFAULT_FOLLOW_UPS_STATE, view: "today" });
  }
  return followUpsHref(DEFAULT_FOLLOW_UPS_STATE);
}
