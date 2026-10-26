// HTTP routes for follow-ups: list (with filters), read one, create, update, delete.
//
// Why a separate file: app.ts only "mounts" this router at /follow-ups, so
// all follow-up URLs live together here. Same pattern as interactionRoutes.ts:
// check the id -> validate the body -> call Prisma -> send JSON.
// The list also powers the in-app reminders: ?due=today and ?due=overdue
// show the OPEN follow-ups that need attention (dates in Asia/Kolkata).
//
// NOTE: no login/permission checks yet; they are added in the later Auth step.
import { Router } from "express";
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { escapeSearchText } from "../shared/escapeSearchText.js";
import { parseId } from "../shared/parseId.js";
import { parseLimit } from "../shared/parseLimit.js";
import { readSearchText } from "../shared/readSearchText.js";
import { sendBadRequest, sendNotFound } from "../shared/httpErrors.js";
import { INCLUDE_CUSTOMER_SUMMARY } from "../shared/customerSummary.js";
import { plainDateToDate, todayInKolkata } from "../shared/plainDate.js";
import { toFollowUpResponse } from "./followUpResponse.js";
import {
  FOLLOW_UP_STATUSES,
  type FollowUpStatusName,
  validateCreateFollowUp,
  validateUpdateFollowUp,
} from "./followUpValidation.js";

// Safety limit on how many follow-ups one list request returns; also the
// default and the largest allowed ?limit=. Pagination comes in a later step.
const MAX_FOLLOW_UPS_PER_LIST = 500;

// Reminder views for ?due=. Both only show OPEN follow-ups.
//   today   -> due exactly today (in Asia/Kolkata)
//   overdue -> due before today (in Asia/Kolkata)
const DUE_VIEWS = ["today", "overdue"] as const;

type DueView = (typeof DUE_VIEWS)[number];

/** The list filters after checking. A missing filter is undefined. */
type ListFilters = {
  customerId?: number;
  status?: FollowUpStatusName;
  due?: DueView;
  // Trimmed ?q= text, matched against the title and the customer's company name.
  search?: string;
};

export const followUpRouter = Router();

/**
 * Read and check every optional list value
 * (?customerId=, ?status=, ?due=, ?q= and ?limit=).
 * Collects ALL problems so the caller gets them in one 400 response.
 * Express gives a string, or an array for odd URLs like ?status=OPEN&status=DONE;
 * anything that is not a single string is invalid.
 */
function readListFilters(
  query: Record<string, unknown>,
):
  | { ok: true; filters: ListFilters; limit: number }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const filters: ListFilters = {};

  if (query.customerId !== undefined) {
    const customerId =
      typeof query.customerId === "string" ? parseId(query.customerId) : null;
    if (customerId === null) {
      errors.push("customerId must be a positive whole number");
    } else {
      filters.customerId = customerId;
    }
  }

  if (query.status !== undefined) {
    const allowedStatuses: readonly unknown[] = FOLLOW_UP_STATUSES;
    if (allowedStatuses.includes(query.status)) {
      filters.status = query.status as FollowUpStatusName;
    } else {
      errors.push(`status must be one of: ${FOLLOW_UP_STATUSES.join(", ")}`);
    }
  }

  if (query.due !== undefined) {
    const allowedDueViews: readonly unknown[] = DUE_VIEWS;
    if (allowedDueViews.includes(query.due)) {
      filters.due = query.due as DueView;
    } else {
      errors.push(`due must be one of: ${DUE_VIEWS.join(", ")}`);
    }
  }

  // "Due today" and "overdue" only make sense for work that is still open.
  if (filters.due !== undefined && filters.status === "DONE") {
    errors.push("due cannot be combined with status=DONE");
  }

  const searchResult = readSearchText(query.q);
  if (searchResult.ok) {
    filters.search = searchResult.search;
  } else {
    errors.push(searchResult.error);
  }

  const limitResult = parseLimit(query.limit, MAX_FOLLOW_UPS_PER_LIST);
  if (!limitResult.ok) {
    errors.push(limitResult.error);
  }

  // "!limitResult.ok" is already covered by errors; it is repeated so
  // TypeScript knows limitResult.limit exists below.
  if (errors.length > 0 || !limitResult.ok) {
    return { ok: false, errors };
  }
  return { ok: true, filters, limit: limitResult.limit };
}

/**
 * Turn the search text into the Prisma conditions for an "OR": a follow-up
 * matches when its title OR its customer's company name contains the text,
 * ignoring upper/lower case. escapeSearchText makes "%" and "_" match literally.
 */
function buildSearchConditions(search: string): Prisma.FollowUpWhereInput[] {
  const containsSearch = {
    contains: escapeSearchText(search),
    mode: "insensitive",
  } as const;
  return [
    { title: containsSearch },
    { customer: { companyName: containsSearch } },
  ];
}

/**
 * Turn checked filters into a Prisma "where". All filters combine with AND;
 * a filter that is undefined is ignored by Prisma.
 * `today` is "YYYY-MM-DD" in Asia/Kolkata (passed in so it is easy to test).
 */
function buildListWhere(
  filters: ListFilters,
  today: string,
): Prisma.FollowUpWhereInput {
  const where: Prisma.FollowUpWhereInput = {
    customerId: filters.customerId,
    status: filters.status,
  };

  if (filters.due === "today") {
    where.status = "OPEN";
    where.dueDate = plainDateToDate(today);
  }
  if (filters.due === "overdue") {
    where.status = "OPEN";
    where.dueDate = { lt: plainDateToDate(today) };
  }
  // Only added when searching, so the "where" of other lists is unchanged.
  if (filters.search !== undefined) {
    where.OR = buildSearchConditions(filters.search);
  }
  return where;
}

// GET /follow-ups -> soonest due first. Optional filters:
// ?customerId=12, ?status=OPEN|DONE, ?due=today|overdue,
// ?q=quote (title or company name contains "quote") (all combine with AND),
// and ?limit=5 to return at most 5 (1 to 500; default 500).
followUpRouter.get("/", async (req, res) => {
  const result = readListFilters(req.query);
  if (!result.ok) {
    sendBadRequest(res, result.errors);
    return;
  }

  const followUps = await prisma.followUp.findMany({
    where: buildListWhere(result.filters, todayInKolkata()),
    // id breaks ties so follow-ups due on the same day keep a stable order.
    orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    take: result.limit,
    include: INCLUDE_CUSTOMER_SUMMARY,
  });
  res.status(200).json(followUps.map(toFollowUpResponse));
});

// GET /follow-ups/:id -> one follow-up.
followUpRouter.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendBadRequest(res, ["id must be a positive whole number"]);
    return;
  }

  const followUp = await prisma.followUp.findUnique({
    where: { id },
    include: INCLUDE_CUSTOMER_SUMMARY,
  });
  if (followUp === null) {
    sendNotFound(res, "Follow-up");
    return;
  }
  res.status(200).json(toFollowUpResponse(followUp));
});

// POST /follow-ups -> create a follow-up for an existing customer.
followUpRouter.post("/", async (req, res) => {
  const result = validateCreateFollowUp(req.body);
  if (!result.ok) {
    sendBadRequest(res, result.errors);
    return;
  }

  // 400 (not 404): the URL is fine, but a value inside the body is wrong.
  const customer = await prisma.customer.findUnique({
    where: { id: result.data.customerId },
  });
  if (customer === null) {
    sendBadRequest(res, ["customerId does not match an existing customer"]);
    return;
  }

  // status not sent -> the database default (OPEN) is used.
  const followUp = await prisma.followUp.create({
    data: result.data,
    include: INCLUDE_CUSTOMER_SUMMARY,
  });
  res.status(201).json(toFollowUpResponse(followUp));
});

// PATCH /follow-ups/:id -> change only the fields that were sent
// (e.g. { "status": "DONE" } to mark it as done).
followUpRouter.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendBadRequest(res, ["id must be a positive whole number"]);
    return;
  }

  const result = validateUpdateFollowUp(req.body);
  if (!result.ok) {
    sendBadRequest(res, result.errors);
    return;
  }

  const existing = await prisma.followUp.findUnique({ where: { id } });
  if (existing === null) {
    sendNotFound(res, "Follow-up");
    return;
  }

  const followUp = await prisma.followUp.update({
    where: { id },
    data: result.data,
    include: INCLUDE_CUSTOMER_SUMMARY,
  });
  res.status(200).json(toFollowUpResponse(followUp));
});

// DELETE /follow-ups/:id -> remove a follow-up; 204 means "done, nothing to send back".
followUpRouter.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendBadRequest(res, ["id must be a positive whole number"]);
    return;
  }

  const existing = await prisma.followUp.findUnique({ where: { id } });
  if (existing === null) {
    sendNotFound(res, "Follow-up");
    return;
  }

  await prisma.followUp.delete({ where: { id } });
  res.status(204).end();
});
