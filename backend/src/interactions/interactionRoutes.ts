// HTTP routes for interactions: list, read one, create, update, delete.
//
// Why a separate file: app.ts only "mounts" this router at /interactions, so
// all interaction URLs live together here. Same pattern as customerRoutes.ts:
// check the id -> validate the body -> call Prisma -> send JSON.
//
// NOTE: no login/permission checks yet; they are added in the later Auth step.
import { Router } from "express";
import { prisma } from "../db.js";
import { parseId } from "../shared/parseId.js";
import { sendBadRequest, sendNotFound } from "../shared/httpErrors.js";
import {
  validateCreateInteraction,
  validateUpdateInteraction,
} from "./interactionValidation.js";

// Safety limit on how many interactions one list request returns.
// Pagination (page by page) comes in a later step.
const MAX_INTERACTIONS_PER_LIST = 500;

export const interactionRouter = Router();

/**
 * Read the optional ?customerId=12 filter.
 * Returns { ok: true, customerId } (undefined when not sent), or { ok: false } when it is invalid.
 * Express gives a string, or an array/object for odd URLs like ?customerId=1&customerId=2;
 * anything that is not a single string is invalid.
 */
function readCustomerIdFilter(
  raw: unknown,
): { ok: true; customerId: number | undefined } | { ok: false } {
  if (raw === undefined) {
    return { ok: true, customerId: undefined };
  }
  if (typeof raw !== "string") {
    return { ok: false };
  }
  const customerId = parseId(raw);
  if (customerId === null) {
    return { ok: false };
  }
  return { ok: true, customerId };
}

// GET /interactions -> newest first. Optional ?customerId=12 shows one customer's interactions.
interactionRouter.get("/", async (req, res) => {
  const filter = readCustomerIdFilter(req.query.customerId);
  if (!filter.ok) {
    sendBadRequest(res, ["customerId must be a positive whole number"]);
    return;
  }

  const interactions = await prisma.interaction.findMany({
    where: { customerId: filter.customerId },
    orderBy: { occurredAt: "desc" },
    take: MAX_INTERACTIONS_PER_LIST,
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

  const interaction = await prisma.interaction.findUnique({ where: { id } });
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
