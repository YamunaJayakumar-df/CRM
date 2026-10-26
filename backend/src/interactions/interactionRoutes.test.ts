// Tests for the /interactions HTTP routes, driven through the real Express app
// with supertest (fake HTTP requests, no real port).
//
// The database is NOT used: vi.mock replaces db.ts with a fake `prisma` whose
// methods are vi.fn() "spies". Each test decides what the fake returns, then
// checks the HTTP response AND what the route asked Prisma to do.
// (Vitest moves vi.mock to the top of the file, so the fake is in place
// before app.js and db.js are imported.)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";

vi.mock("../db.js", () => ({
  prisma: {
    // POST /interactions checks that the customer exists.
    customer: {
      findUnique: vi.fn(),
    },
    interaction: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Short names for the fake Prisma methods, so tests read more easily.
const findCustomer = vi.mocked(prisma.customer.findUnique);
const findMany = vi.mocked(prisma.interaction.findMany);
const findUnique = vi.mocked(prisma.interaction.findUnique);
const create = vi.mocked(prisma.interaction.create);
const update = vi.mocked(prisma.interaction.update);
const deleteInteraction = vi.mocked(prisma.interaction.delete);

// A customer as Prisma would return it.
const acme = {
  id: 12,
  companyName: "Acme Ltd",
  contactName: null,
  email: null,
  phone: null,
  notes: null,
  createdAt: new Date("2026-01-15T10:00:00.000Z"),
  updatedAt: new Date("2026-01-15T10:00:00.000Z"),
};

// An interaction as Prisma would return it (dates are real Date objects)...
const call = {
  id: 1,
  customerId: 12,
  type: "CALL" as const,
  summary: "Discussed renewal",
  occurredAt: new Date("2026-10-26T10:30:00.000Z"),
  createdAt: new Date("2026-10-26T11:00:00.000Z"),
  updatedAt: new Date("2026-10-26T11:00:00.000Z"),
};

// ...and the same interaction as the client receives it (dates become ISO text).
const callAsJson = {
  id: 1,
  customerId: 12,
  type: "CALL",
  summary: "Discussed renewal",
  occurredAt: "2026-10-26T10:30:00.000Z",
  createdAt: "2026-10-26T11:00:00.000Z",
  updatedAt: "2026-10-26T11:00:00.000Z",
};

const invalidId = {
  error: "Invalid request",
  details: ["id must be a positive whole number"],
};

beforeEach(() => {
  // Forget calls and return values from the previous test.
  vi.resetAllMocks();
});

afterEach(() => {
  // Undo any vi.spyOn (e.g. the silenced console.error).
  vi.restoreAllMocks();
});

describe("GET /interactions", () => {
  // Protects the list endpoint: newest first, with a safety limit, no filter.
  it("returns 200 with all interactions, newest first", async () => {
    findMany.mockResolvedValue([call]);

    const res = await request(createApp()).get("/interactions");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([callAsJson]);
    expect(findMany).toHaveBeenCalledWith({
      where: { customerId: undefined },
      orderBy: { occurredAt: "desc" },
      take: 500,
    });
  });

  // Protects the ?customerId filter used by a customer's detail page.
  it("filters by ?customerId", async () => {
    findMany.mockResolvedValue([call]);

    const res = await request(createApp()).get("/interactions?customerId=12");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith({
      where: { customerId: 12 },
      orderBy: { occurredAt: "desc" },
      take: 500,
    });
  });

  // Protects that a bad filter is rejected before the database is asked.
  // A repeated ?customerId arrives as an array, which must not slip through.
  for (const query of ["customerId=abc", "customerId=0", "customerId=1&customerId=2"]) {
    it(`returns 400 for ?${query} and does not query the database`, async () => {
      const res = await request(createApp()).get(`/interactions?${query}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Invalid request",
        details: ["customerId must be a positive whole number"],
      });
      expect(findMany).not.toHaveBeenCalled();
    });
  }
});

describe("GET /interactions/:id", () => {
  // Protects reading one interaction by id.
  it("returns 200 with the interaction", async () => {
    findUnique.mockResolvedValue(call);

    const res = await request(createApp()).get("/interactions/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(callAsJson);
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  // Protects that bad ids are rejected before the database is asked.
  it("returns 400 for an invalid id and does not query the database", async () => {
    const res = await request(createApp()).get("/interactions/abc");

    expect(res.status).toBe(400);
    expect(res.body).toEqual(invalidId);
    expect(findUnique).not.toHaveBeenCalled();
  });

  // Protects the "no such interaction" answer.
  it("returns 404 when the interaction does not exist", async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(createApp()).get("/interactions/999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Interaction not found" });
  });
});

describe("POST /interactions", () => {
  // Protects logging an interaction: Prisma receives clean data and the given time.
  it("returns 201 and saves trimmed data with occurredAt as a Date", async () => {
    findCustomer.mockResolvedValue(acme);
    create.mockResolvedValue(call);

    const res = await request(createApp()).post("/interactions").send({
      customerId: 12,
      type: "CALL",
      summary: "  Discussed renewal  ",
      occurredAt: "2026-10-26T16:00:00+05:30",
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(callAsJson);
    expect(findCustomer).toHaveBeenCalledWith({ where: { id: 12 } });
    expect(create).toHaveBeenCalledWith({
      data: {
        customerId: 12,
        type: "CALL",
        summary: "Discussed renewal",
        occurredAt: new Date("2026-10-26T10:30:00.000Z"),
      },
    });
  });

  // Protects the default: no occurredAt means "it happened now".
  it("uses the current time when occurredAt is not sent", async () => {
    findCustomer.mockResolvedValue(acme);
    create.mockResolvedValue(call);
    const before = Date.now();

    const res = await request(createApp())
      .post("/interactions")
      .send({ customerId: 12, type: "NOTE", summary: "Quick note" });

    const after = Date.now();
    expect(res.status).toBe(201);
    const saved = create.mock.calls[0][0].data;
    expect(saved.occurredAt).toBeInstanceOf(Date);
    const savedTime = (saved.occurredAt as Date).getTime();
    expect(savedTime).toBeGreaterThanOrEqual(before);
    expect(savedTime).toBeLessThanOrEqual(after);
  });

  // Protects that invalid bodies never reach the database.
  it("returns 400 with details for an invalid body and makes no database calls", async () => {
    const res = await request(createApp())
      .post("/interactions")
      .send({ customerId: 12, type: "call", summary: "" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: [
        "type must be one of: CALL, EMAIL, MEETING, NOTE",
        "summary cannot be empty",
      ],
    });
    expect(findCustomer).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  // Protects against interactions for a customer that does not exist.
  it("returns 400 when the customer does not exist and does not create", async () => {
    findCustomer.mockResolvedValue(null);

    const res = await request(createApp())
      .post("/interactions")
      .send({ customerId: 999, type: "CALL", summary: "Hello" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["customerId does not match an existing customer"],
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("PATCH /interactions/:id", () => {
  // Protects partial updates: only the sent fields go to Prisma.
  it("returns 200 with the updated interaction", async () => {
    const updated = { ...call, summary: "Renewal agreed" };
    findUnique.mockResolvedValue(call);
    update.mockResolvedValue(updated);

    const res = await request(createApp())
      .patch("/interactions/1")
      .send({ summary: " Renewal agreed " });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...callAsJson, summary: "Renewal agreed" });
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { summary: "Renewal agreed" },
    });
  });

  // Protects that bad ids are rejected before the database is asked.
  it("returns 400 for an invalid id and does not query the database", async () => {
    const res = await request(createApp())
      .patch("/interactions/0")
      .send({ summary: "Hi" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(invalidId);
    expect(findUnique).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  // Protects that invalid bodies never reach the database.
  it("returns 400 for an invalid body and does not query the database", async () => {
    const res = await request(createApp())
      .patch("/interactions/1")
      .send({ customerId: 5 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: [
        "customerId cannot be changed",
        "Provide at least one field to update",
      ],
    });
    expect(findUnique).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  // Protects the "no such interaction" answer (and that nothing is updated).
  it("returns 404 when the interaction does not exist and does not update", async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(createApp())
      .patch("/interactions/999")
      .send({ summary: "Hi" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Interaction not found" });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("DELETE /interactions/:id", () => {
  // Protects deleting: 204 "No Content" with an empty body.
  it("returns 204 with an empty body and deletes the interaction", async () => {
    findUnique.mockResolvedValue(call);
    deleteInteraction.mockResolvedValue(call);

    const res = await request(createApp()).delete("/interactions/1");

    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect(deleteInteraction).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  // Protects that bad ids are rejected before the database is asked.
  it("returns 400 for an invalid id and does not query the database", async () => {
    const res = await request(createApp()).delete("/interactions/1.5");

    expect(res.status).toBe(400);
    expect(res.body).toEqual(invalidId);
    expect(findUnique).not.toHaveBeenCalled();
    expect(deleteInteraction).not.toHaveBeenCalled();
  });

  // Protects the "no such interaction" answer (and that nothing is deleted).
  it("returns 404 when the interaction does not exist and does not delete", async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(createApp()).delete("/interactions/999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Interaction not found" });
    expect(deleteInteraction).not.toHaveBeenCalled();
  });
});

describe("error handling", () => {
  // Protects that database failures give a generic 500 and leak no internals.
  it("returns a generic 500 when the database throws, without leaking details", async () => {
    // The error handler logs to console.error; silence it so test output stays clean.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findMany.mockRejectedValue(new Error("connection to secret-db-host failed"));

    const res = await request(createApp()).get("/interactions");

    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: "Something went wrong" });
    expect(res.text).not.toContain("secret-db-host");
    expect(consoleError).toHaveBeenCalled(); // logged on the server only
  });
});
