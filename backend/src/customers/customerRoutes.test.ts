// Tests for the /customers HTTP routes, driven through the real Express app
// with supertest (fake HTTP requests, no real port).
//
// The database is NOT used: vi.mock replaces db.ts with a fake `prisma` whose
// customer methods are vi.fn() "spies". Each test decides what the fake
// returns, then checks the HTTP response AND what the route asked Prisma to do.
// (Vitest moves vi.mock to the top of the file, so the fake is in place
// before app.js and db.js are imported.)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";

vi.mock("../db.js", () => ({
  prisma: {
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // DELETE /customers/:id counts the customer's interactions and follow-ups first.
    interaction: {
      count: vi.fn(),
    },
    followUp: {
      count: vi.fn(),
    },
  },
}));

// Short names for the fake Prisma methods, so tests read more easily.
const findMany = vi.mocked(prisma.customer.findMany);
const findUnique = vi.mocked(prisma.customer.findUnique);
const create = vi.mocked(prisma.customer.create);
const update = vi.mocked(prisma.customer.update);
const deleteCustomer = vi.mocked(prisma.customer.delete);
const countInteractions = vi.mocked(prisma.interaction.count);
const countFollowUps = vi.mocked(prisma.followUp.count);

// A customer as Prisma would return it (dates are real Date objects)...
const acme = {
  id: 1,
  companyName: "Acme Ltd",
  contactName: "Jane Doe",
  website: "acme.com",
  industry: null,
  status: "ACTIVE" as const,
  email: "jane@acme.com",
  phone: null,
  notes: null,
  createdAt: new Date("2026-01-15T10:00:00.000Z"),
  updatedAt: new Date("2026-01-15T10:00:00.000Z"),
};

// ...and the same customer as the client receives it. JSON has no Date type,
// so dates arrive as ISO text strings.
const acmeAsJson = {
  id: 1,
  companyName: "Acme Ltd",
  contactName: "Jane Doe",
  website: "acme.com",
  industry: null,
  status: "ACTIVE" as const,
  email: "jane@acme.com",
  phone: null,
  notes: null,
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
};

beforeEach(() => {
  // Forget calls and return values from the previous test.
  vi.resetAllMocks();
});

afterEach(() => {
  // Undo any vi.spyOn (e.g. the silenced console.error).
  vi.restoreAllMocks();
});

describe("GET /customers", () => {
  // Protects the list endpoint: returns customers A-Z with a safety limit.
  it("returns 200 with the list of customers", async () => {
    findMany.mockResolvedValue([acme]);

    const res = await request(createApp()).get("/customers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([acmeAsJson]);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: { companyName: "asc" },
      take: 500,
    });
  });

  // Protects that "no customers yet" is an empty list, not an error.
  it("returns 200 with an empty list when there are no customers", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/customers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /customers?q= (search)", () => {
  // Protects the search: any of the four fields may contain the text,
  // upper/lower case ignored, with the same order and safety limit as the list.
  it("searches company, contact, email and website, ignoring case", async () => {
    findMany.mockResolvedValue([acme]);

    const res = await request(createApp()).get("/customers?q=acme");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([acmeAsJson]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { companyName: { contains: "acme", mode: "insensitive" } },
          { contactName: { contains: "acme", mode: "insensitive" } },
          { email: { contains: "acme", mode: "insensitive" } },
          { website: { contains: "acme", mode: "insensitive" } },
        ],
      },
      orderBy: { companyName: "asc" },
      take: 500,
    });
  });

  // Protects that "%" is searched literally (escaped), not as "match anything".
  it("escapes % in the search text before asking the database", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/customers?q=100%25");

    expect(res.status).toBe(200);
    const where = findMany.mock.calls[0][0]?.where;
    expect(where?.OR?.[0]).toEqual({
      companyName: { contains: "100\\%", mode: "insensitive" },
    });
  });

  // Protects that spaces around the search text are ignored.
  it("trims the search text", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/customers?q=%20%20acme%20");

    expect(res.status).toBe(200);
    const where = findMany.mock.calls[0][0]?.where;
    expect(where?.OR?.[0]).toEqual({
      companyName: { contains: "acme", mode: "insensitive" },
    });
  });

  // Protects that a blank search shows all customers instead of matching "".
  it("treats a blank search as no filter", async () => {
    findMany.mockResolvedValue([acme]);

    const res = await request(createApp()).get("/customers?q=%20%20");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([acmeAsJson]);
    // toHaveBeenCalledWith ignores keys that are undefined, so check `where` directly.
    expect(findMany.mock.calls[0][0]?.where).toBeUndefined();
  });

  // Protects that a repeated ?q (which arrives as an array) is rejected.
  it("returns 400 for ?q=a&q=b and does not query the database", async () => {
    const res = await request(createApp()).get("/customers?q=a&q=b");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["q must be a single search text"],
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  // Protects the search length limit: 100 characters is allowed.
  it("accepts a search of exactly 100 characters", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get(`/customers?q=${"a".repeat(100)}`);

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  // Protects the search length limit: 101 characters is rejected.
  it("returns 400 for a search of 101 characters and does not query the database", async () => {
    const res = await request(createApp()).get(`/customers?q=${"a".repeat(101)}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["q must be at most 100 characters"],
    });
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("GET /customers/:id", () => {
  // Protects reading one customer by id.
  it("returns 200 with the customer", async () => {
    findUnique.mockResolvedValue(acme);

    const res = await request(createApp()).get("/customers/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(acmeAsJson);
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  // Protects that bad ids are rejected before the database is asked.
  it("returns 400 for an invalid id and does not query the database", async () => {
    const res = await request(createApp()).get("/customers/abc");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["id must be a positive whole number"],
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  // Protects the "no such customer" answer.
  it("returns 404 when the customer does not exist", async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(createApp()).get("/customers/999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Customer not found" });
  });
});

describe("POST /customers", () => {
  // Protects creating a customer: Prisma receives cleaned (trimmed) data.
  it("returns 201 with the new customer and saves trimmed data", async () => {
    create.mockResolvedValue(acme);

    const res = await request(createApp())
      .post("/customers")
      .send({ companyName: "  Acme Ltd  ", contactName: " Jane Doe ", email: "jane@acme.com" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(acmeAsJson);
    expect(create).toHaveBeenCalledWith({
      data: {
        companyName: "Acme Ltd",
        contactName: "Jane Doe",
        email: "jane@acme.com",
      },
    });
  });

  // Protects that industry and status are saved when creating a customer.
  it("passes industry and status through to the database", async () => {
    const created = { ...acme, industry: "Healthcare", status: "INACTIVE" as const };
    create.mockResolvedValue(created);

    const res = await request(createApp())
      .post("/customers")
      .send({ companyName: "Acme Ltd", industry: " Healthcare ", status: "INACTIVE" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ...acmeAsJson, industry: "Healthcare", status: "INACTIVE" });
    expect(create).toHaveBeenCalledWith({
      data: { companyName: "Acme Ltd", industry: "Healthcare", status: "INACTIVE" },
    });
  });

  // Protects that a wrong status never reaches the database.
  it("returns 400 for a lowercase status and does not create", async () => {
    const res = await request(createApp())
      .post("/customers")
      .send({ companyName: "Acme Ltd", status: "active" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["status must be one of: ACTIVE, INACTIVE"],
    });
    expect(create).not.toHaveBeenCalled();
  });

  // Protects that invalid bodies never reach the database.
  it("returns 400 with details for an invalid body and does not create", async () => {
    const res = await request(createApp())
      .post("/customers")
      .send({ companyName: "", id: 5 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["Unknown field: id", "companyName cannot be empty"],
    });
    expect(create).not.toHaveBeenCalled();
  });

  // Protects that a request with no body at all is rejected, not a crash.
  it("returns 400 when no body is sent", async () => {
    const res = await request(createApp()).post("/customers");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["Request body must be a JSON object"],
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("PATCH /customers/:id", () => {
  // Protects partial updates: only the sent fields go to Prisma.
  it("returns 200 with the updated customer", async () => {
    const updated = { ...acme, phone: "555-1234" };
    findUnique.mockResolvedValue(acme);
    update.mockResolvedValue(updated);

    const res = await request(createApp())
      .patch("/customers/1")
      .send({ phone: " 555-1234 " });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...acmeAsJson, phone: "555-1234" });
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { phone: "555-1234" },
    });
  });

  // Protects changing the industry and marking a customer as INACTIVE.
  it("passes industry and status through to the database", async () => {
    const updated = { ...acme, industry: "Retail", status: "INACTIVE" as const };
    findUnique.mockResolvedValue(acme);
    update.mockResolvedValue(updated);

    const res = await request(createApp())
      .patch("/customers/1")
      .send({ industry: " Retail ", status: "INACTIVE" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...acmeAsJson, industry: "Retail", status: "INACTIVE" });
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { industry: "Retail", status: "INACTIVE" },
    });
  });

  // Protects that bad ids are rejected before the database is asked.
  it("returns 400 for an invalid id and does not query the database", async () => {
    const res = await request(createApp())
      .patch("/customers/-3")
      .send({ phone: "123" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["id must be a positive whole number"],
    });
    expect(findUnique).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  // Protects that invalid bodies never reach the database.
  it("returns 400 for an empty body and does not update", async () => {
    const res = await request(createApp()).patch("/customers/1").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["Provide at least one field to update"],
    });
    expect(update).not.toHaveBeenCalled();
  });

  // Protects the "no such customer" answer (and that nothing is updated).
  it("returns 404 when the customer does not exist and does not update", async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(createApp())
      .patch("/customers/999")
      .send({ phone: "123" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Customer not found" });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("DELETE /customers/:id", () => {
  // Protects deleting: 204 "No Content" with an empty body.
  it("returns 204 with an empty body and deletes the customer", async () => {
    findUnique.mockResolvedValue(acme);
    countInteractions.mockResolvedValue(0);
    countFollowUps.mockResolvedValue(0);
    deleteCustomer.mockResolvedValue(acme);

    const res = await request(createApp()).delete("/customers/1");

    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect(countInteractions).toHaveBeenCalledWith({ where: { customerId: 1 } });
    expect(countFollowUps).toHaveBeenCalledWith({ where: { customerId: 1 } });
    expect(deleteCustomer).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  // Protects history: a customer with interactions is never deleted (409 Conflict).
  it("returns 409 when the customer still has interactions and does not delete", async () => {
    findUnique.mockResolvedValue(acme);
    countInteractions.mockResolvedValue(3);
    countFollowUps.mockResolvedValue(0);

    const res = await request(createApp()).delete("/customers/1");

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: "Customer still has interactions or follow-ups; delete them first",
    });
    expect(deleteCustomer).not.toHaveBeenCalled();
  });

  // Protects open work: a customer with follow-ups is never deleted (409 Conflict).
  it("returns 409 when the customer still has follow-ups and does not delete", async () => {
    findUnique.mockResolvedValue(acme);
    countInteractions.mockResolvedValue(0);
    countFollowUps.mockResolvedValue(2);

    const res = await request(createApp()).delete("/customers/1");

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: "Customer still has interactions or follow-ups; delete them first",
    });
    expect(deleteCustomer).not.toHaveBeenCalled();
  });

  // Protects that bad ids are rejected before the database is asked.
  it("returns 400 for an invalid id and does not query the database", async () => {
    const res = await request(createApp()).delete("/customers/1.5");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["id must be a positive whole number"],
    });
    expect(findUnique).not.toHaveBeenCalled();
    expect(countInteractions).not.toHaveBeenCalled();
    expect(countFollowUps).not.toHaveBeenCalled();
    expect(deleteCustomer).not.toHaveBeenCalled();
  });

  // Protects the "no such customer" answer (and that nothing is deleted).
  it("returns 404 when the customer does not exist and does not delete", async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(createApp()).delete("/customers/999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Customer not found" });
    expect(countInteractions).not.toHaveBeenCalled();
    expect(countFollowUps).not.toHaveBeenCalled();
    expect(deleteCustomer).not.toHaveBeenCalled();
  });
});

describe("error handling", () => {
  // Protects that broken JSON gets a clear 400, not a 500 or an HTML page.
  it("returns 400 for a malformed JSON body", async () => {
    const res = await request(createApp())
      .post("/customers")
      .set("Content-Type", "application/json")
      .send('{"companyName": ');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Request body is not valid JSON" });
    expect(create).not.toHaveBeenCalled();
  });

  // Protects that database failures give a generic 500 and leak no internals.
  it("returns a generic 500 when the database throws, without leaking details", async () => {
    // The error handler logs to console.error; silence it so test output stays clean.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findMany.mockRejectedValue(new Error("connection to secret-db-host failed"));

    const res = await request(createApp()).get("/customers");

    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: "Something went wrong" });
    expect(res.text).not.toContain("secret-db-host");
    expect(res.text).not.toContain("at "); // no stack trace lines
    expect(consoleError).toHaveBeenCalled(); // logged on the server only
  });
});
