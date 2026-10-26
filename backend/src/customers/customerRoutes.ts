// HTTP routes for customers: list, read one, create, update, delete.
//
// Why a separate file: app.ts only "mounts" this router at /customers, so all
// customer URLs live together here. Interactions and follow-ups use this
// same pattern: check the id -> validate the body -> call Prisma -> send JSON.
//
// NOTE: no login/permission checks yet; they are added in the later Auth step.
import { Router } from "express";
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { escapeSearchText } from "../shared/escapeSearchText.js";
import { parseId } from "../shared/parseId.js";
import { readSearchText } from "../shared/readSearchText.js";
import {
  sendBadRequest,
  sendConflict,
  sendNotFound,
} from "../shared/httpErrors.js";
import {
  validateCreateCustomer,
  validateUpdateCustomer,
} from "./customerValidation.js";

// Safety limit on how many customers one list request returns.
// Pagination (page by page) comes in a later step.
const MAX_CUSTOMERS_PER_LIST = 500;

export const customerRouter = Router();

/**
 * Turn the search text into a Prisma "where": a customer matches when ANY of
 * these fields contains the text, ignoring upper/lower case.
 * No search -> undefined, which means "all customers".
 * Prisma sends the text as a parameter, so it cannot inject SQL;
 * escapeSearchText makes "%" and "_" match literally instead of as wildcards.
 */
function buildSearchWhere(
  search: string | undefined,
): Prisma.CustomerWhereInput | undefined {
  if (search === undefined) {
    return undefined;
  }
  const containsSearch = {
    contains: escapeSearchText(search),
    mode: "insensitive",
  } as const;
  return {
    OR: [
      { companyName: containsSearch },
      { contactName: containsSearch },
      { email: containsSearch },
      { website: containsSearch },
    ],
  };
}

// GET /customers -> all customers, A to Z by company name.
// Optional ?q=acme only shows customers whose company name, contact name,
// email or website contains "acme" (upper/lower case does not matter).
customerRouter.get("/", async (req, res) => {
  const result = readSearchText(req.query.q);
  if (!result.ok) {
    sendBadRequest(res, [result.error]);
    return;
  }

  const customers = await prisma.customer.findMany({
    where: buildSearchWhere(result.search),
    orderBy: { companyName: "asc" },
    take: MAX_CUSTOMERS_PER_LIST,
  });
  res.status(200).json(customers);
});

// GET /customers/:id -> one customer.
customerRouter.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendBadRequest(res, ["id must be a positive whole number"]);
    return;
  }

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (customer === null) {
    sendNotFound(res, "Customer");
    return;
  }
  res.status(200).json(customer);
});

// POST /customers -> create a customer, returns it with its new id.
customerRouter.post("/", async (req, res) => {
  const result = validateCreateCustomer(req.body);
  if (!result.ok) {
    sendBadRequest(res, result.errors);
    return;
  }

  const customer = await prisma.customer.create({ data: result.data });
  res.status(201).json(customer);
});

// PATCH /customers/:id -> change only the fields that were sent.
customerRouter.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendBadRequest(res, ["id must be a positive whole number"]);
    return;
  }

  const result = validateUpdateCustomer(req.body);
  if (!result.ok) {
    sendBadRequest(res, result.errors);
    return;
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (existing === null) {
    sendNotFound(res, "Customer");
    return;
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: result.data,
  });
  res.status(200).json(customer);
});

// DELETE /customers/:id -> remove a customer; 204 means "done, nothing to send back".
// A customer that still has interactions or follow-ups is NOT deleted (409),
// so history and open work are never lost.
customerRouter.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendBadRequest(res, ["id must be a positive whole number"]);
    return;
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (existing === null) {
    sendNotFound(res, "Customer");
    return;
  }

  // This check gives a friendly message. The database's ON DELETE RESTRICT
  // rule is the second safety net if a row is added in between.
  const interactionCount = await prisma.interaction.count({
    where: { customerId: id },
  });
  const followUpCount = await prisma.followUp.count({
    where: { customerId: id },
  });
  if (interactionCount > 0 || followUpCount > 0) {
    sendConflict(
      res,
      "Customer still has interactions or follow-ups; delete them first",
    );
    return;
  }

  await prisma.customer.delete({ where: { id } });
  res.status(204).end();
});
