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
  website: "acme.com",
  industry: null,
  status: "ACTIVE" as const,
  email: null,
  phone: null,
  notes: null,
  createdAt: new Date("2026-01-15T10:00:00.000Z"),
  updatedAt: new Date("2026-01-15T10:00:00.000Z"),
};

// The small customer summary Prisma adds to each interaction because of the
// include below. Only these four fields: no email, phone or notes.
const acmeSummary = {
  id: 12,
  companyName: "Acme Ltd",
  website: "acme.com",
  status: "ACTIVE" as const,
};

// Every interaction query that returns rows must ask Prisma for this summary.
// Written out on purpose (not imported) so an accidental change in
// shared/customerSummary.ts makes these tests fail.
const includeCustomerSummary = {
  customer: {
    select: { id: true, companyName: true, website: true, status: true },
  },
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
  customer: acmeSummary,
};

// ...and the same interaction as the client receives it (dates become ISO
// text, the customer summary is passed through unchanged).
const callAsJson = {
  id: 1,
  customerId: 12,
  type: "CALL",
  summary: "Discussed renewal",
  occurredAt: "2026-10-26T10:30:00.000Z",
  createdAt: "2026-10-26T11:00:00.000Z",
  updatedAt: "2026-10-26T11:00:00.000Z",
  customer: {
    id: 12,
    companyName: "Acme Ltd",
    website: "acme.com",
    status: "ACTIVE",
  },
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
      include: includeCustomerSummary,
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
      include: includeCustomerSummary,
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

  // Protects ?limit= (e.g. the dashboard's "5 newest interactions").
  it("passes ?limit=5 to the database as take: 5", async () => {
    findMany.mockResolvedValue([call]);

    const res = await request(createApp()).get("/interactions?limit=5");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith({
      where: { customerId: undefined },
      orderBy: { occurredAt: "desc" },
      take: 5,
      include: includeCustomerSummary,
    });
  });

  // Protects that a limit below 1 is rejected before the database is asked.
  it("returns 400 for ?limit=0 and does not query the database", async () => {
    const res = await request(createApp()).get("/interactions?limit=0");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: ["limit must be a whole number from 1 to 500"],
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  // Protects that a bad customerId AND a bad limit are both reported at once.
  it("lists both problems for a bad customerId and a bad limit", async () => {
    const res = await request(createApp()).get("/interactions?customerId=abc&limit=501");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid request",
      details: [
        "customerId must be a positive whole number",
        "limit must be a whole number from 1 to 500",
      ],
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  // Protects that a plain list sends ONLY customerId in "where": no type,
  // no OR and no occurredAt keys sneak in when no filter is used.
  it("sends no extra filter keys for a plain list", async () => {
    findMany.mockResolvedValue([]);

    await request(createApp()).get("/interactions");

    const where = findMany.mock.calls[0][0]?.where;
    expect(where).toStrictEqual({ customerId: undefined });
  });
});

// The full findMany call the list route makes for a given "where" and limit.
function listQuery(where: object, take = 500) {
  return {
    where,
    orderBy: { occurredAt: "desc" },
    take,
    include: includeCustomerSummary,
  };
}

// The 400 body for the given messages.
function badRequest(...details: string[]) {
  return { error: "Invalid request", details };
}

describe("GET /interactions filters (?q, ?type, ?from, ?to)", () => {
  // Protects ?q=: summary OR company name contains the text, any case.
  it("?q= searches the summary and the customer's company name", async () => {
    findMany.mockResolvedValue([call]);

    const res = await request(createApp()).get("/interactions?q=%20renewal%20");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      listQuery({
        customerId: undefined,
        OR: [
          { summary: { contains: "renewal", mode: "insensitive" } },
          {
            customer: {
              companyName: { contains: "renewal", mode: "insensitive" },
            },
          },
        ],
      }),
    );
  });

  // Protects that "%" is searched literally, not as "match everything".
  it("?q=%25 escapes the percent sign", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/interactions?q=%25");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      listQuery({
        customerId: undefined,
        OR: [
          { summary: { contains: "\\%", mode: "insensitive" } },
          {
            customer: {
              companyName: { contains: "\\%", mode: "insensitive" },
            },
          },
        ],
      }),
    );
  });

  // Protects that a blank ?q= means "no search" (no OR added).
  it("ignores a blank ?q=", async () => {
    findMany.mockResolvedValue([]);

    await request(createApp()).get("/interactions?q=%20%20");

    expect(findMany.mock.calls[0][0]?.where).toStrictEqual({
      customerId: undefined,
    });
  });

  // Protects ?type=.
  it("?type=MEETING filters by type", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/interactions?type=MEETING");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      listQuery({ customerId: undefined, type: "MEETING" }),
    );
  });

  // Protects ?from= alone: from 00:00 IST that day, no upper limit.
  it("?from= alone sends only occurredAt.gte", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/interactions?from=2026-10-01");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      listQuery({
        customerId: undefined,
        occurredAt: { gte: new Date("2026-09-30T18:30:00.000Z") },
      }),
    );
  });

  // Protects ?to= alone: the whole `to` day is included.
  it("?to= alone sends only occurredAt.lt (start of the next day)", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/interactions?to=2026-10-05");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      listQuery({
        customerId: undefined,
        occurredAt: { lt: new Date("2026-10-05T18:30:00.000Z") },
      }),
    );
  });

  // Protects ?from=&to= together (both days included).
  it("?from=&to= sends both ends of the window", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get(
      "/interactions?from=2026-10-01&to=2026-10-31",
    );

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      listQuery({
        customerId: undefined,
        occurredAt: {
          gte: new Date("2026-09-30T18:30:00.000Z"),
          lt: new Date("2026-10-31T18:30:00.000Z"),
        },
      }),
    );
  });

  // Protects that all filters combine with AND in one "where".
  it("combines customerId, type, q, from, to and limit", async () => {
    findMany.mockResolvedValue([call]);

    const res = await request(createApp()).get(
      "/interactions?customerId=12&type=CALL&q=renewal&from=2026-10-01&to=2026-10-31&limit=5",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual([callAsJson]);
    expect(findMany).toHaveBeenCalledWith(
      listQuery(
        {
          customerId: 12,
          type: "CALL",
          OR: [
            { summary: { contains: "renewal", mode: "insensitive" } },
            {
              customer: {
                companyName: { contains: "renewal", mode: "insensitive" },
              },
            },
          ],
          occurredAt: {
            gte: new Date("2026-09-30T18:30:00.000Z"),
            lt: new Date("2026-10-31T18:30:00.000Z"),
          },
        },
        5,
      ),
    );
  });
});

describe("GET /interactions ?range=", () => {
  // Freeze the clock at 20:00 UTC on 26 October. In India that is already
  // 01:30 on 27 October, so "today" must be 2026-10-27.
  // Only Date is faked, so supertest's real timers keep working.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-26T20:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Protects "7d" using TODAY IN INDIA (27 Oct), not the server's UTC date.
  it("?range=7d covers 21 Oct to 27 Oct in Kolkata", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/interactions?range=7d");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      listQuery({
        customerId: undefined,
        occurredAt: {
          gte: new Date("2026-10-20T18:30:00.000Z"), // 21 Oct 00:00 IST
          lt: new Date("2026-10-27T18:30:00.000Z"), // 28 Oct 00:00 IST
        },
      }),
    );
  });

  // Protects "30d" reaching the database (28 Sep to 27 Oct).
  it("?range=30d starts 29 days before today in Kolkata", async () => {
    findMany.mockResolvedValue([]);

    const res = await request(createApp()).get("/interactions?range=30d");

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      listQuery({
        customerId: undefined,
        occurredAt: {
          gte: new Date("2026-09-27T18:30:00.000Z"), // 28 Sep 00:00 IST
          lt: new Date("2026-10-27T18:30:00.000Z"),
        },
      }),
    );
  });
});

describe("GET /interactions filter errors", () => {
  // Protects each new 400 message, and that the database is never asked.
  // Repeated values (?type=CALL&type=NOTE) arrive as arrays and must be rejected.
  const cases: Array<[query: string, message: string]> = [
    ["type=call", "type must be one of: CALL, EMAIL, MEETING, NOTE"],
    ["type=", "type must be one of: CALL, EMAIL, MEETING, NOTE"],
    ["type=CALL&type=NOTE", "type must be one of: CALL, EMAIL, MEETING, NOTE"],
    ["range=1y", "range must be one of: 7d, 30d, 90d"],
    ["range=7D", "range must be one of: 7d, 30d, 90d"],
    ["range=7d&range=30d", "range must be one of: 7d, 30d, 90d"],
    ["from=2026-02-31", 'from must be a date like "2026-10-26"'],
    ["from=26-10-2026", 'from must be a date like "2026-10-26"'],
    ["from=2026-10-01&from=2026-10-02", 'from must be a date like "2026-10-26"'],
    ["to=2026-10-26T10:00", 'to must be a date like "2026-10-26"'],
    ["to=2026-10-01&to=2026-10-02", 'to must be a date like "2026-10-26"'],
    ["range=7d&from=2026-10-01", "Use either range or from/to, not both"],
    ["range=7d&to=2026-10-31", "Use either range or from/to, not both"],
    ["from=2026-10-31&to=2026-10-01", "from must be on or before to"],
    ["q=a&q=b", "q must be a single search text"],
  ];

  for (const [query, message] of cases) {
    it(`returns 400 for ?${query} and does not query the database`, async () => {
      const res = await request(createApp()).get(`/interactions?${query}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual(badRequest(message));
      expect(findMany).not.toHaveBeenCalled();
    });
  }

  // Protects that ALL problems come back in one 400, in a fixed order:
  // customerId, type, q, range/from-to conflict, from after to, limit.
  it("lists every problem at once, in the documented order", async () => {
    const res = await request(createApp()).get(
      "/interactions?customerId=abc&type=call&q=a&q=b&range=7d&from=2026-10-31&to=2026-10-01&limit=0",
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      badRequest(
        "customerId must be a positive whole number",
        "type must be one of: CALL, EMAIL, MEETING, NOTE",
        "q must be a single search text",
        "Use either range or from/to, not both",
        "from must be on or before to",
        "limit must be a whole number from 1 to 500",
      ),
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  // Protects the order of the date messages: conflict, range, from, to.
  it("lists the date problems in order: conflict, range, from, to", async () => {
    const res = await request(createApp()).get(
      "/interactions?range=1y&from=bad&to=bad",
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      badRequest(
        "Use either range or from/to, not both",
        "range must be one of: 7d, 30d, 90d",
        'from must be a date like "2026-10-26"',
        'to must be a date like "2026-10-26"',
      ),
    );
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("GET /interactions/:id", () => {
  // Protects reading one interaction by id.
  it("returns 200 with the interaction", async () => {
    findUnique.mockResolvedValue(call);

    const res = await request(createApp()).get("/interactions/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(callAsJson);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: includeCustomerSummary,
    });
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
      include: includeCustomerSummary,
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
    // The existence check only needs the row itself, so it has no include...
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    // ...but the final update returns the row with its customer summary.
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { summary: "Renewal agreed" },
      include: includeCustomerSummary,
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
