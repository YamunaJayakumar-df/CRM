// Tests for the /follow-ups HTTP routes, driven through the real Express app
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
    // POST /follow-ups checks that the customer exists.
    customer: {
      findUnique: vi.fn(),
    },
    followUp: {
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
const findMany = vi.mocked(prisma.followUp.findMany);
const findUnique = vi.mocked(prisma.followUp.findUnique);
const create = vi.mocked(prisma.followUp.create);
const update = vi.mocked(prisma.followUp.update);
const deleteFollowUp = vi.mocked(prisma.followUp.delete);

// A customer as Prisma would return it.
const acme = {
  id: 12,
  companyName: "Acme Ltd",
  contactName: null,
  website: "acme.com",
  email: null,
  phone: null,
  notes: null,
  createdAt: new Date("2026-01-15T10:00:00.000Z"),
  updatedAt: new Date("2026-01-15T10:00:00.000Z"),
};

// The small customer summary Prisma adds to each follow-up because of the
// include below. Only these three fields: no email, phone or notes.
const acmeSummary = { id: 12, companyName: "Acme Ltd", website: "acme.com" };

// Every follow-up query that returns rows must ask Prisma for this summary.
// Written out on purpose (not imported) so an accidental change in
// shared/customerSummary.ts makes these tests fail.
const includeCustomerSummary = {
  customer: { select: { id: true, companyName: true, website: true } },
};

// A follow-up as Prisma would return it: dueDate is a Date at midnight UTC...
const sendQuote = {
  id: 1,
  customerId: 12,
  title: "Send quote",
  dueDate: new Date("2026-10-30T00:00:00.000Z"),
  status: "OPEN" as const,
  notes: null,
  createdAt: new Date("2026-10-26T11:00:00.000Z"),
  updatedAt: new Date("2026-10-26T11:00:00.000Z"),
  customer: acmeSummary,
};

// ...and the same follow-up as the client receives it.
// dueDate is a plain day "YYYY-MM-DD", NOT "2026-10-30T00:00:00.000Z",
// and the customer summary is passed through unchanged.
const sendQuoteAsJson = {
  id: 1,
  customerId: 12,
  title: "Send quote",
  dueDate: "2026-10-30",
  status: "OPEN",
  notes: null,
  createdAt: "2026-10-26T11:00:00.000Z",
  updatedAt: "2026-10-26T11:00:00.000Z",
  customer: { id: 12, companyName: "Acme Ltd", website: "acme.com" },
};

// The list order, safety limit and customer summary used by every
// GET /follow-ups request.
const listOrderAndLimit = {
  orderBy: [{ dueDate: "asc" }, { id: "asc" }],
  take: 500,
  include: includeCustomerSummary,
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

describe("GET /follow-ups", () => {
  // Protects the list endpoint: soonest due first, stable order, safety limit.
  it("returns 200 with all follow-ups and dueDate as a plain day", async () => {
    findMany.mockResolvedValue([sendQuote]);

    const res = await request(createApp()).get("/follow-ups");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([sendQuoteAsJson]);
    expect(findMany).toHaveBeenCalledWith({
      where: { customerId: undefined, status: undefined },
      ...listOrderAndLimit,
    });
  });

  // Protects the ?customerId filter used by a customer's detail page.
  it("filters by ?customerId", async () => {
    findMany.mockResolvedValue([sendQuote]);

    const res = await request(createApp()).get("/follow-ups?customerId=12");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith({
      where: { customerId: 12, status: undefined },
      ...listOrderAndLimit,
    });
  });

  // Protects the ?status filter for both allowed values.
  for (const status of ["OPEN", "DONE"]) {
    it(`filters by ?status=${status}`, async () => {
      findMany.mockResolvedValue([]);

      const res = await request(createApp()).get(`/follow-ups?status=${status}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
      expect(findMany).toHaveBeenCalledWith({
        where: { customerId: undefined, status },
        ...listOrderAndLimit,
      });
    });
  }
});

describe("GET /follow-ups reminders (?due=)", () => {
  // Freeze the clock at 20:00 UTC on 26 October. In India (UTC+05:30) that is
  // already 01:30 on 27 October, so "today" must be 2026-10-27, not 2026-10-26.
  // Only Date is faked, so supertest's real timers keep working.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-26T20:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Protects "due today": OPEN follow-ups due on today's date in India.
  it("?due=today asks for OPEN follow-ups due on today's date in India", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/follow-ups?due=today");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        customerId: undefined,
        status: "OPEN",
        dueDate: new Date("2026-10-27T00:00:00.000Z"),
      },
      ...listOrderAndLimit,
    });
  });

  // Protects "overdue": OPEN follow-ups due BEFORE today's date in India.
  it("?due=overdue asks for OPEN follow-ups due before today in India", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/follow-ups?due=overdue");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        customerId: undefined,
        status: "OPEN",
        dueDate: { lt: new Date("2026-10-27T00:00:00.000Z") },
      },
      ...listOrderAndLimit,
    });
  });

  // Protects that filters combine: one customer's overdue follow-ups.
  it("combines ?customerId with ?due", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/follow-ups?customerId=12&due=overdue");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        customerId: 12,
        status: "OPEN",
        dueDate: { lt: new Date("2026-10-27T00:00:00.000Z") },
      },
      ...listOrderAndLimit,
    });
  });

  // Protects that ?status=OPEN together with ?due is allowed (it is the same thing).
  it("accepts ?due=today together with ?status=OPEN", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/follow-ups?due=today&status=OPEN");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        customerId: undefined,
        status: "OPEN",
        dueDate: new Date("2026-10-27T00:00:00.000Z"),
      },
      ...listOrderAndLimit,
    });
  });
});

describe("GET /follow-ups with invalid filters", () => {
  // Protects that each bad filter is rejected before the database is asked.
  // A repeated ?status arrives as an array, which must not slip through.
  const badFilters: Array<[string, string]> = [
    ["customerId=abc", "customerId must be a positive whole number"],
    ["status=open", "status must be one of: OPEN, DONE"],
    ["status=OPEN&status=DONE", "status must be one of: OPEN, DONE"],
    ["due=tomorrow", "due must be one of: today, overdue"],
    ["due=today&status=DONE", "due cannot be combined with status=DONE"],
  ];

  for (const [query, message] of badFilters) {
    it(`returns 400 for ?${query} and does not query the database`, async () => {
      const res = await request(createApp()).get(`/follow-ups?${query}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid request", details: [message] });
      expect(findMany).not.toHaveBeenCalled();
    });
  }

  // Protects that the user sees EVERY filter problem in one response.
  it("lists every filter problem at once", async () => {
    const res = await request(createApp()).get(
      "/follow-ups?customerId=abc&status=open&due=tomorrow",
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: [
        "customerId must be a positive whole number",
        "status must be one of: OPEN, DONE",
        "due must be one of: today, overdue",
      ],
    });
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("GET /follow-ups/:id", () => {
  // Protects reading one follow-up by id.
  it("returns 200 with the follow-up", async () => {
    findUnique.mockResolvedValue(sendQuote);

    const res = await request(createApp()).get("/follow-ups/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sendQuoteAsJson);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: includeCustomerSummary,
    });
  });

  // Protects that bad ids are rejected before the database is asked.
  it("returns 400 for an invalid id and does not query the database", async () => {
    const res = await request(createApp()).get("/follow-ups/abc");

    expect(res.status).toBe(400);
    expect(res.body).toEqual(invalidId);
    expect(findUnique).not.toHaveBeenCalled();
  });

  // Protects the "no such follow-up" answer.
  it("returns 404 when the follow-up does not exist", async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(createApp()).get("/follow-ups/999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Follow-up not found" });
  });
});

describe("POST /follow-ups", () => {
  // Protects creating a follow-up: Prisma receives clean data with dueDate as a Date.
  it("returns 201 and saves trimmed data with dueDate as midnight UTC", async () => {
    findCustomer.mockResolvedValue(acme);
    create.mockResolvedValue(sendQuote);

    const res = await request(createApp())
      .post("/follow-ups")
      .send({ customerId: 12, title: "  Send quote ", dueDate: "2026-10-30" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sendQuoteAsJson);
    expect(findCustomer).toHaveBeenCalledWith({ where: { id: 12 } });
    expect(create).toHaveBeenCalledWith({
      data: {
        customerId: 12,
        title: "Send quote",
        dueDate: new Date("2026-10-30T00:00:00.000Z"),
      },
      include: includeCustomerSummary,
    });
  });

  // Protects that invalid bodies never reach the database.
  it("returns 400 with details for an invalid body and makes no database calls", async () => {
    const res = await request(createApp())
      .post("/follow-ups")
      .send({ customerId: 12, title: "", dueDate: "2026-02-31" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["title cannot be empty", 'dueDate must be a date like "2026-10-30"'],
    });
    expect(findCustomer).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  // Protects against follow-ups for a customer that does not exist.
  it("returns 400 when the customer does not exist and does not create", async () => {
    findCustomer.mockResolvedValue(null);

    const res = await request(createApp())
      .post("/follow-ups")
      .send({ customerId: 999, title: "Send quote", dueDate: "2026-10-30" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["customerId does not match an existing customer"],
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("PATCH /follow-ups/:id", () => {
  // Protects "mark as done": only the sent field goes to Prisma.
  it("returns 200 with the updated follow-up", async () => {
    const done = { ...sendQuote, status: "DONE" as const };
    findUnique.mockResolvedValue(sendQuote);
    update.mockResolvedValue(done);

    const res = await request(createApp())
      .patch("/follow-ups/1")
      .send({ status: "DONE" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...sendQuoteAsJson, status: "DONE" });
    // The existence check only needs the row itself, so it has no include...
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    // ...but the final update returns the row with its customer summary.
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: "DONE" },
      include: includeCustomerSummary,
    });
  });

  // Protects that bad ids are rejected before the database is asked.
  it("returns 400 for an invalid id and does not query the database", async () => {
    const res = await request(createApp())
      .patch("/follow-ups/0")
      .send({ status: "DONE" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(invalidId);
    expect(findUnique).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  // Protects that invalid bodies never reach the database.
  it("returns 400 for an invalid body and does not query the database", async () => {
    const res = await request(createApp())
      .patch("/follow-ups/1")
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

  // Protects the "no such follow-up" answer (and that nothing is updated).
  it("returns 404 when the follow-up does not exist and does not update", async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(createApp())
      .patch("/follow-ups/999")
      .send({ status: "DONE" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Follow-up not found" });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("DELETE /follow-ups/:id", () => {
  // Protects deleting: 204 "No Content" with an empty body.
  it("returns 204 with an empty body and deletes the follow-up", async () => {
    findUnique.mockResolvedValue(sendQuote);
    deleteFollowUp.mockResolvedValue(sendQuote);

    const res = await request(createApp()).delete("/follow-ups/1");

    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect(deleteFollowUp).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  // Protects that bad ids are rejected before the database is asked.
  it("returns 400 for an invalid id and does not query the database", async () => {
    const res = await request(createApp()).delete("/follow-ups/1.5");

    expect(res.status).toBe(400);
    expect(res.body).toEqual(invalidId);
    expect(findUnique).not.toHaveBeenCalled();
    expect(deleteFollowUp).not.toHaveBeenCalled();
  });

  // Protects the "no such follow-up" answer (and that nothing is deleted).
  it("returns 404 when the follow-up does not exist and does not delete", async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(createApp()).delete("/follow-ups/999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Follow-up not found" });
    expect(deleteFollowUp).not.toHaveBeenCalled();
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

    const res = await request(createApp()).get("/follow-ups");

    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: "Something went wrong" });
    expect(res.text).not.toContain("secret-db-host");
    expect(consoleError).toHaveBeenCalled(); // logged on the server only
  });
});
