// Named, typed functions for each piece of data the pages need.
//
// Why: pages call `listFollowUps({ due: "today" })` instead of building URLs
// themselves, so every backend URL lives in this one file. Server-only, like
// backendFetch.ts: call these from Server Components / Server Actions only,
// and never inside "use cache" (CRM data must be fresh on every request).
import "server-only";
import { backendGet } from "./backendFetch";
import { BackendRequestError } from "./backendRequestError";
import { buildQueryString } from "./buildQueryString";
import type {
  Customer,
  DashboardSummary,
  FollowUp,
  FollowUpStatus,
  Interaction,
  InteractionType,
} from "./types";

/** Filters for listFollowUps. Every field is optional; they combine with AND. */
export type FollowUpFilters = {
  status?: FollowUpStatus;
  /** "today" = OPEN and due today, "overdue" = OPEN and due before today (Asia/Kolkata). */
  due?: "today" | "overdue";
  customerId?: number;
  /** Search text. */
  q?: string;
  /** Maximum number of rows to return. */
  limit?: number;
};

/** The backend's quick date ranges: today and the 6 / 29 / 89 days before (India). */
export type InteractionDateRange = "7d" | "30d" | "90d";

/** Filters for listInteractions. Every field is optional; they combine with AND. */
export type InteractionFilters = {
  customerId?: number;
  /** Only this kind of interaction (call, email, meeting or note). */
  type?: InteractionType;
  /** Search text, matched against the summary and the company name. */
  q?: string;
  /** Only interactions in this quick date range. Leave out for all time. */
  range?: InteractionDateRange;
  /** Maximum number of rows to return (newest first, 1 to 500). */
  limit?: number;
};

/** All dashboard numbers in one request. */
export function getDashboardSummary(): Promise<DashboardSummary> {
  return backendGet<DashboardSummary>("/dashboard");
}

/**
 * One customer by id.
 * Returns null when `id` is not a positive whole number or no customer has
 * that id, so a page can simply call notFound(). Other failures throw.
 */
export async function getCustomer(id: number): Promise<Customer | null> {
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  try {
    return await backendGet<Customer>(`/customers/${id}`);
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** All customers A to Z; with `search`, only those matching it. */
export function listCustomers(search?: string): Promise<Customer[]> {
  return backendGet<Customer[]>(`/customers${buildQueryString({ q: search })}`);
}

/** Follow-ups, soonest due first, narrowed by the given filters. */
export function listFollowUps(filters: FollowUpFilters = {}): Promise<FollowUp[]> {
  const query = buildQueryString({
    status: filters.status,
    due: filters.due,
    customerId: filters.customerId,
    q: filters.q,
    limit: filters.limit,
  });
  return backendGet<FollowUp[]>(`/follow-ups${query}`);
}

/**
 * One interaction by id (with its customer's summary).
 * Returns null when `id` is not a positive whole number or no interaction
 * has that id, so a page can simply call notFound(). Other failures throw.
 */
export async function getInteraction(id: number): Promise<Interaction | null> {
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  try {
    return await backendGet<Interaction>(`/interactions/${id}`);
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** Interactions, newest first, narrowed by the given filters. */
export function listInteractions(
  filters: InteractionFilters = {},
): Promise<Interaction[]> {
  const query = buildQueryString({
    customerId: filters.customerId,
    type: filters.type,
    q: filters.q,
    range: filters.range,
    limit: filters.limit,
  });
  return backendGet<Interaction[]>(`/interactions${query}`);
}
