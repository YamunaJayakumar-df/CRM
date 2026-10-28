// Tests for saving a confirmed review, with a FAKE database (no real writes).
// The fake $transaction just runs the function with a fake `tx`; the real
// "undo everything" is the database's job, so here we check that nothing is
// written BEFORE a problem is found, and what happens with the ticket.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../generated/prisma/client.js";
import { saveConfirmedReview } from "./saveReview.js";
import type { ConfirmedItem, ConfirmedSave } from "./saveValidation.js";

// vi.hoisted: these fakes must exist before vi.mock runs (it moves to the top).
const fake = vi.hoisted(() => {
  const tx = {
    customer: { findMany: vi.fn(), create: vi.fn() },
    interaction: { create: vi.fn() },
    followUp: { create: vi.fn() },
    aiSave: { create: vi.fn() },
  };
  return {
    tx,
    prisma: {
      aiSave: { findUnique: vi.fn() },
      $transaction: vi.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx)),
    },
  };
});

vi.mock("../db.js", () => ({ prisma: fake.prisma }));

const { tx } = fake;
const NOW = new Date("2026-10-28T12:00:00.000Z");
const REVIEW_ID = "a3f9c2e1-5b7d-4c8e-9f1a-2b3c4d5e6f70";

const ORCHID_ITEM: ConfirmedItem = {
  customer: { kind: "existing", id: 39 },
  interaction: { type: "MEETING", summary: "Met Vikram." },
  followUps: [{ title: "Send quote", dueDate: new Date("2026-11-02T00:00:00.000Z"), priority: "HIGH" }],
};

const NOVA_ITEM: ConfirmedItem = {
  customer: { kind: "new", data: { companyName: "Nova Tech", contactName: "Kiran" } },
  interaction: null,
  followUps: [
    { title: "Arrange a demo", dueDate: new Date("2026-11-02T00:00:00.000Z"), priority: "MEDIUM" },
    { title: "Send brochure", dueDate: new Date("2026-11-03T00:00:00.000Z") },
  ],
};

function review(items: ConfirmedItem[]): ConfirmedSave {
  return { reviewId: REVIEW_ID, items };
}

/** The error Prisma throws when a unique value (here: the ticket id) is used twice. */
function duplicateTicketError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "7.10.1" });
}

beforeEach(() => {
  vi.clearAllMocks();
  fake.prisma.aiSave.findUnique.mockResolvedValue(null); // ticket not used yet
  tx.customer.findMany.mockImplementation(async ({ where }) => where.id.in.map((id: number) => ({ id })));
  tx.customer.create.mockResolvedValue({ id: 101 });
  let nextId = 500;
  tx.interaction.create.mockImplementation(async () => ({ id: nextId++ }));
  tx.followUp.create.mockImplementation(async () => ({ id: nextId++ }));
  tx.aiSave.create.mockResolvedValue({});
});

describe("saveConfirmedReview", () => {
  it("saves each customer with ITS interaction and follow-ups, then the ticket", async () => {
    const outcome = await saveConfirmedReview(review([ORCHID_ITEM, NOVA_ITEM]), NOW);

    const result = {
      items: [
        { customerId: 39, customerCreated: false, interactionId: 500, followUpIds: [501] },
        { customerId: 101, customerCreated: true, interactionId: null, followUpIds: [502, 503] },
      ],
    };
    expect(outcome).toEqual({ kind: "saved", result });

    // Orchid: existing customer, meeting "now", its follow-up.
    expect(tx.interaction.create).toHaveBeenCalledWith({
      data: { type: "MEETING", summary: "Met Vikram.", customerId: 39, occurredAt: NOW },
      select: { id: true },
    });
    // Nova Tech: created, and BOTH its follow-ups use the new id 101.
    expect(tx.customer.create).toHaveBeenCalledWith({
      data: { companyName: "Nova Tech", contactName: "Kiran" },
      select: { id: true },
    });
    expect(tx.followUp.create.mock.calls.map(([call]) => [call.data.title, call.data.customerId])).toEqual([
      ["Send quote", 39],
      ["Arrange a demo", 101],
      ["Send brochure", 101],
    ]);
    // The ticket is written last, in the same transaction, with the result.
    expect(tx.aiSave.create).toHaveBeenCalledWith({ data: { id: REVIEW_ID, result } });
    const ticketOrder = tx.aiSave.create.mock.invocationCallOrder[0]!;
    expect(Math.max(...tx.followUp.create.mock.invocationCallOrder)).toBeLessThan(ticketOrder);
  });

  // Spec scenario 10: a repeated Save must not create records twice.
  it("returns the earlier result for a used ticket and writes NOTHING", async () => {
    const earlier = { items: [{ customerId: 39, customerCreated: false, interactionId: 500, followUpIds: [501] }] };
    fake.prisma.aiSave.findUnique.mockResolvedValue({ id: REVIEW_ID, createdAt: NOW, result: earlier });

    expect(await saveConfirmedReview(review([ORCHID_ITEM]), NOW)).toEqual({ kind: "alreadySaved", result: earlier });
    expect(fake.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("answers 'already saved' when another Save of the same review won the race", async () => {
    const winner = { items: [{ customerId: 39, customerCreated: false, interactionId: 777, followUpIds: [] }] };
    fake.prisma.aiSave.findUnique
      .mockResolvedValueOnce(null) // the quick check: not saved yet...
      .mockResolvedValueOnce({ id: REVIEW_ID, createdAt: NOW, result: winner }); // ...but then the other won
    tx.aiSave.create.mockRejectedValue(duplicateTicketError()); // the database refuses our ticket

    expect(await saveConfirmedReview(review([ORCHID_ITEM]), NOW)).toEqual({ kind: "alreadySaved", result: winner });
  });

  // Spec scenario 8: a chosen id that is not in the database.
  it("refuses unknown customer ids before writing anything", async () => {
    tx.customer.findMany.mockResolvedValue([]); // #39 was deleted
    expect(await saveConfirmedReview(review([ORCHID_ITEM, NOVA_ITEM]), NOW)).toEqual({ kind: "unknownCustomers", ids: [39] });
    expect(tx.customer.create).not.toHaveBeenCalled();
    expect(tx.interaction.create).not.toHaveBeenCalled();
    expect(tx.followUp.create).not.toHaveBeenCalled();
    expect(tx.aiSave.create).not.toHaveBeenCalled();
  });

  it("accepts any existing customer, even one that was not offered (owner rule C)", async () => {
    const notOffered: ConfirmedItem = { ...ORCHID_ITEM, customer: { kind: "existing", id: 12 } };
    const outcome = await saveConfirmedReview(review([notOffered]), NOW);
    expect(outcome.kind).toBe("saved");
  });

  it("looks up each chosen customer once", async () => {
    await saveConfirmedReview(review([ORCHID_ITEM, ORCHID_ITEM, NOVA_ITEM]), NOW);
    expect(tx.customer.findMany).toHaveBeenCalledWith({ where: { id: { in: [39] } }, select: { id: true } });
  });

  it("passes other database errors on (the route answers 500)", async () => {
    tx.followUp.create.mockRejectedValue(new Error("connection lost"));
    await expect(saveConfirmedReview(review([ORCHID_ITEM]), NOW)).rejects.toThrow("connection lost");
  });
});
