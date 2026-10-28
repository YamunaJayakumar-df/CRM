// HTTP routes for interactions: list, read one, create, update, delete.
//
// Why a separate file: app.ts only "mounts" this router at /interactions, so
// all interaction URLs live together here. Same pattern as customerRoutes.ts:
// check the id -> validate the body -> call Prisma -> send JSON.
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
import { isPlainDate, todayInKolkata } from "../shared/plainDate.js";
import {
  DATE_RANGES,
  buildOccurredAtWindow,
  isDateRange,
  type DateFilters,
} from "./interactionDateWindow.js";
import {
  INTERACTION_TYPES,
  type InteractionTypeName,
  validateCreateInteraction,
  validateUpdateInteraction,
} from "./interactionValidation.js";

// Safety limit on how many interactions one list request returns; also the
// default and the largest allowed ?limit=. Pagination comes in a later step.
const MAX_INTERACTIONS_PER_LIST = 500;

/** The list filters after checking. A missing filter is undefined. */
type ListFilters = {
  customerId?: number;
  type?: InteractionTypeName;
  // Trimmed ?q= text, matched against the summary and the customer's company name.
  search?: string;
  // ?range= or ?from=/?to= (never both), turned into an occurredAt window later.
  dates: DateFilters;
};

export const interactionRouter = Router();

/**
 * Read and check every optional list value
 * (?customerId=, ?type=, ?q=, ?range=, ?from=, ?to= and ?limit=).
 * Collects ALL problems so the caller gets them in one 400 response.
 * Express gives a string, or an array for odd URLs like ?type=CALL&type=NOTE;
 * anything that is not a single string is invalid.
 */
function readListFilters(
  query: Record<string, unknown>,
):
  | { ok: true; filters: ListFilters; limit: number }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const filters: ListFilters = { dates: {} };

  if (query.customerId !== undefined) {
    const customerId =
      typeof query.customerId === "string" ? parseId(query.customerId) : null;
    if (customerId === null) {
      errors.push("customerId must be a positive whole number");
    } else {
      filters.customerId = customerId;
    }
  }

  if (query.type !== undefined) {
    const allowedTypes: readonly unknown[] = INTERACTION_TYPES;
    if (allowedTypes.includes(query.type)) {
      filters.type = query.type as InteractionTypeName;
    } else {
      errors.push(`type must be one of: ${INTERACTION_TYPES.join(", ")}`);
    }
  }

  const searchResult = readSearchText(query.q);
  if (searchResult.ok) {
    filters.search = searchResult.search;
  } else {
    errors.push(searchResult.error);
  }

  readDateFilters(query, filters.dates, errors);

  const limitResult = parseLimit(query.limit, MAX_INTERACTIONS_PER_LIST);
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
 * Read ?range=7d|30d|90d, or ?from=YYYY-MM-DD and/or ?to=YYYY-MM-DD.
 * Valid values are stored in `dates`; problems are added to `errors`.
 */
function readDateFilters(
  query: Record<string, unknown>,
  dates: DateFilters,
  errors: string[],
): void {
  // Two ways to pick dates in one request would be ambiguous, so reject it.
  const sentRange = query.range !== undefined;
  const sentFromOrTo = query.from !== undefined || query.to !== undefined;
  if (sentRange && sentFromOrTo) {
    errors.push("Use either range or from/to, not both");
  }

  if (sentRange) {
    if (isDateRange(query.range)) {
      dates.range = query.range;
    } else {
      errors.push(`range must be one of: ${DATE_RANGES.join(", ")}`);
    }
  }

  if (query.from !== undefined) {
    if (isPlainDate(query.from)) {
      dates.from = query.from;
    } else {
      errors.push('from must be a date like "2026-10-26"');
    }
  }

  if (query.to !== undefined) {
    if (isPlainDate(query.to)) {
      dates.to = query.to;
    } else {
      errors.push('to must be a date like "2026-10-26"');
    }
  }

  // "YYYY-MM-DD" text sorts like the dates themselves, so ">" compares days.
  if (dates.from !== undefined && dates.to !== undefined && dates.from > dates.to) {
    errors.push("from must be on or before to");
  }
}

/**
 * Turn the search text into the Prisma conditions for an "OR": an interaction
 * matches when its summary OR its customer's company name contains the text,
 * ignoring upper/lower case. escapeSearchText makes "%" and "_" match literally.
 */
function buildSearchConditions(
  search: string,
): Prisma.InteractionWhereInput[] {
  const containsSearch = {
    contains: escapeSearchText(search),
    mode: "insensitive",
  } as const;
  return [
    { summary: containsSearch },
    { customer: { companyName: containsSearch } },
  ];
}

/**
 * Turn checked filters into a Prisma "where". All filters combine with AND.
 * `today` is "YYYY-MM-DD" in Asia/Kolkata (passed in so it is easy to test).
 */
function buildListWhere(
  filters: ListFilters,
  today: string,
): Prisma.InteractionWhereInput {
  const where: Prisma.InteractionWhereInput = {
    customerId: filters.customerId,
  };

  // Each key is only added when used, so the "where" of plain lists is unchanged.
  if (filters.type !== undefined) {
    where.type = filters.type;
  }
  if (filters.search !== undefined) {
    where.OR = buildSearchConditions(filters.search);
  }
  const window = buildOccurredAtWindow(filters.dates, today);
  if (window.gte !== undefined || window.lt !== undefined) {
    where.occurredAt = window;
  }
  return where;
}

// GET /interactions -> newest first. Optional filters (all combine with AND):
// ?customerId=12 shows one customer's interactions,
// ?type=CALL|EMAIL|MEETING|NOTE,
// ?q=renewal (summary or company name contains "renewal"),
// ?range=7d|30d|90d (today and the days before, in Asia/Kolkata), OR
// ?from=2026-10-01&to=2026-10-31 (both days included; either may be alone),
// and ?limit=5 to return at most 5 (1 to 500; default 500).
interactionRouter.get("/", async (req, res) => {
  const result = readListFilters(req.query);
  if (!result.ok) {
    sendBadRequest(res, result.errors);
    return;
  }

  const interactions = await prisma.interaction.findMany({
    where: buildListWhere(result.filters, todayInKolkata()),
    orderBy: { occurredAt: "desc" },
    take: result.limit,
    include: INCLUDE_CUSTOMER_SUMMARY,
  });
  res.status(200).json(interactions);
});

// GET /interactions/:id -> one interaction.
interactionRouter.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendBadRequest(res, ["id must be a positive whole number"]);
    return;
  }

  const interaction = await prisma.interaction.findUnique({
    where: { id },
    include: INCLUDE_CUSTOMER_SUMMARY,
  });
  if (interaction === null) {
    sendNotFound(res, "Interaction");
    return;
  }
  res.status(200).json(interaction);
});

// POST /interactions -> log a new interaction for an existing customer.
interactionRouter.post("/", async (req, res) => {
  const result = validateCreateInteraction(req.body);
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

  const interaction = await prisma.interaction.create({
    data: {
      ...result.data,
      // Not sent -> it happened "now".
      occurredAt: result.data.occurredAt ?? new Date(),
    },
    include: INCLUDE_CUSTOMER_SUMMARY,
  });
  res.status(201).json(interaction);
});

// PATCH /interactions/:id -> change only the fields that were sent.
interactionRouter.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendBadRequest(res, ["id must be a positive whole number"]);
    return;
  }

  const result = validateUpdateInteraction(req.body);
  if (!result.ok) {
    sendBadRequest(res, result.errors);
    return;
  }

  const existing = await prisma.interaction.findUnique({ where: { id } });
  if (existing === null) {
    sendNotFound(res, "Interaction");
    return;
  }

  const interaction = await prisma.interaction.update({
    where: { id },
    data: result.data,
    include: INCLUDE_CUSTOMER_SUMMARY,
  });
  res.status(200).json(interaction);
});

// DELETE /interactions/:id -> remove an interaction; 204 means "done, nothing to send back".
interactionRouter.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendBadRequest(res, ["id must be a positive whole number"]);
    return;
  }

  const existing = await prisma.interaction.findUnique({ where: { id } });
  if (existing === null) {
    sendNotFound(res, "Interaction");
    return;
  }

  await prisma.interaction.delete({ where: { id } });
  res.status(204).end();
});
