// Reads and writes the Interactions page's filters in the URL.
//
// The page's state lives in the URL, e.g.
//   /interactions?view=table&range=7d&q=renewal&customerId=12
// Why the URL (and not React state): the page stays a Server Component,
// every control is a plain link or GET form that works without JavaScript,
// and a filtered view can be bookmarked or shared.
// Defaults are left OUT of links (kanban, last 30 days, no search, no
// customer), so the plain view is just "/interactions".
// Hand-edited or odd values never break the page: anything unknown falls
// back to the default.
import type { InteractionDateRange, InteractionFilters } from "@/lib/api/queries";
import { buildQueryString } from "@/lib/api/buildQueryString";
import type { InteractionType } from "@/lib/api/types";
import { readCustomerId } from "@/lib/dashboard/customerPanelView";
import { firstValue, type SearchParamValue } from "@/lib/dashboard/followUpView";

/** The two ways to show the list. */
export type InteractionsView = "kanban" | "table";

/** Date range choices. "all" = no date filter (the backend's ranges plus "All time"). */
export type InteractionsRange = InteractionDateRange | "all";

/** Everything the page reads from its URL. */
export type InteractionsState = {
  view: InteractionsView;
  range: InteractionsRange;
  /** Search text, trimmed; "" = no search. */
  search: string;
  /** Only this customer's interactions; null = every customer. */
  customerId: number | null;
};

/** The Interactions page's URL search params, as Next.js gives them. */
export type InteractionsSearchParams = Record<string, SearchParamValue>;

/** Views in the order the toggle shows them. */
export const INTERACTIONS_VIEWS: readonly InteractionsView[] = ["table", "kanban"];

export const INTERACTIONS_VIEW_LABELS: Record<InteractionsView, string> = {
  table: "Table",
  kanban: "Kanban",
};

/** Ranges in the order they are shown. */
export const INTERACTIONS_RANGES: readonly InteractionsRange[] = ["7d", "30d", "90d", "all"];

export const INTERACTIONS_RANGE_LABELS: Record<InteractionsRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

/** Shorter labels for phones, where four "Last N days" do not fit in one row. */
export const INTERACTIONS_RANGE_SHORT_LABELS: Record<InteractionsRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  all: "All time",
};

/** What the page shows when the URL says nothing. */
export const DEFAULT_INTERACTIONS_STATE: InteractionsState = {
  view: "kanban",
  range: "30d",
  search: "",
  customerId: null,
};

/** Longest search text we pass on (the backend allows 100 characters). */
const MAX_SEARCH_LENGTH = 100;

/** ?view=table|kanban. Anything else -> "kanban". */
export function readInteractionsView(value: SearchParamValue): InteractionsView {
  const text = firstValue(value);
  return INTERACTIONS_VIEWS.find((view) => view === text) ?? DEFAULT_INTERACTIONS_STATE.view;
}

/** ?range=7d|30d|90d|all. Anything else -> "30d". */
export function readInteractionsRange(value: SearchParamValue): InteractionsRange {
  const text = firstValue(value);
  return INTERACTIONS_RANGES.find((range) => range === text) ?? DEFAULT_INTERACTIONS_STATE.range;
}

/** ?q=... trimmed and at most 100 characters. Missing or blank -> "". */
export function readInteractionsSearch(value: SearchParamValue): string {
  return (firstValue(value) ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
}

/** Reads the whole page state from the URL. ?customerId must be digits, or it is ignored. */
export function readInteractionsState(params: InteractionsSearchParams): InteractionsState {
  return {
    view: readInteractionsView(params.view),
    range: readInteractionsRange(params.range),
    search: readInteractionsSearch(params.q),
    customerId: readCustomerId(params.customerId),
  };
}

/**
 * The page link for a state, leaving defaults out.
 * Pass the current state with one field changed, e.g.
 *   interactionsHref({ ...state, view: "table" })
 * Example: { view: "table", range: "7d", search: "R&D", customerId: 12 }
 *   -> "/interactions?view=table&range=7d&q=R%26D&customerId=12"
 */
export function interactionsHref(state: InteractionsState): string {
  const defaults = DEFAULT_INTERACTIONS_STATE;
  return `/interactions${buildQueryString({
    view: state.view === defaults.view ? undefined : state.view,
    range: state.range === defaults.range ? undefined : state.range,
    q: state.search,
    customerId: state.customerId ?? undefined,
  })}`;
}

/**
 * The backend filters for a state. `type` narrows to one Kanban column;
 * `limit` caps the rows. "All time" sends no range at all.
 */
export function interactionFiltersFor(
  state: InteractionsState,
  limit: number,
  type?: InteractionType,
): InteractionFilters {
  return {
    type,
    q: state.search === "" ? undefined : state.search,
    range: state.range === "all" ? undefined : state.range,
    customerId: state.customerId ?? undefined,
    limit,
  };
}

/**
 * A short text that changes whenever the list must be loaded again.
 * Used as a Suspense `key`, so new filters show the loading skeleton
 * instead of the old results.
 */
export function interactionsStateKey(state: InteractionsState): string {
  return interactionsHref(state);
}

/** Message + hint for the page's empty state, depending on what is filtered. */
export function interactionsEmptyText(state: InteractionsState): { message: string; hint: string } {
  if (state.search !== "" || state.customerId !== null) {
    return {
      message: "No interactions match",
      hint: "Try another search, remove the customer filter, or choose a longer date range.",
    };
  }
  if (state.range === "all") {
    return {
      message: "No interactions yet",
      hint: "Calls, emails, meetings and notes you log will appear here.",
    };
  }
  return {
    message: "No interactions in this period",
    hint: "Try a longer date range, such as Last 90 days or All time.",
  };
}
