// Saves a confirmed AI review: the ONLY AI code that writes to the database.
//
// Three safety layers (like a bank counter):
//   1. ticket check: was this review id already saved? -> "already saved",
//      nothing new is written (double click, slow network, retry);
//   2. every existingId must really exist, checked INSIDE the transaction;
//   3. one transaction: customers, interactions, follow-ups AND the ticket
//      are saved together, or nothing is (never half a note).
// Two Saves at the same moment: both try to write the same ticket id; the
// database lets only one win, the other one's transaction is undone and it
// answers "already saved".
//
// The data was already checked by validateConfirmedSave (saveValidation.ts).
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";
import type { ConfirmedItem, ConfirmedSave } from "./saveValidation.js";

// Same idea as the demo seed: give a slow connection time to finish.
const TRANSACTION_TIMEOUT_MS = 30_000;

/** What was created for one customer of the note. */
export type SavedItem = {
  customerId: number;
  customerCreated: boolean;
  interactionId: number | null;
  followUpIds: number[];
};

export type SaveResult = { items: SavedItem[] };

export type SaveOutcome =
  | { kind: "saved"; result: SaveResult }
  /** This review was saved before; nothing new was written. */
  | { kind: "alreadySaved"; result: SaveResult }
  /** Some existingIds are not in the database; nothing was written. */
  | { kind: "unknownCustomers"; ids: number[] };

/** Thrown inside the transaction to undo it when a customer is missing. */
class UnknownCustomersError extends Error {
  constructor(readonly ids: number[]) {
    super(`Unknown customers: ${ids.join(", ")}`);
  }
}

/** True when the database refused a duplicate unique value (here: a used ticket). */
function isDuplicateTicket(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** The stored result of an earlier save of this review, or null. */
async function findEarlierSave(reviewId: string): Promise<SaveResult | null> {
  const earlier = await prisma.aiSave.findUnique({ where: { id: reviewId } });
  return earlier === null ? null : (earlier.result as SaveResult);
}

/** The existing customer ids the user chose (each once). */
function chosenExistingIds(items: ConfirmedItem[]): number[] {
  const ids = items.flatMap((item) => (item.customer.kind === "existing" ? [item.customer.id] : []));
  return [...new Set(ids)];
}

/** Save one customer of the note inside the transaction `tx`. */
async function saveItem(tx: Prisma.TransactionClient, item: ConfirmedItem, now: Date): Promise<SavedItem> {
  let customerId: number;
  let customerCreated = false;
  if (item.customer.kind === "existing") {
    customerId = item.customer.id;
  } else {
    const created = await tx.customer.create({ data: item.customer.data, select: { id: true } });
    customerId = created.id;
    customerCreated = true;
  }

  let interactionId: number | null = null;
  if (item.interaction !== null) {
    const interaction = await tx.interaction.create({
      data: { ...item.interaction, customerId, occurredAt: item.interaction.occurredAt ?? now },
      select: { id: true },
    });
    interactionId = interaction.id;
  }

  const followUpIds: number[] = [];
  for (const followUp of item.followUps) {
    const created = await tx.followUp.create({ data: { ...followUp, customerId }, select: { id: true } });
    followUpIds.push(created.id);
  }
  return { customerId, customerCreated, interactionId, followUpIds };
}

/** Save a confirmed review once. See the safety layers at the top of the file. */
export async function saveConfirmedReview(save: ConfirmedSave, now: Date = new Date()): Promise<SaveOutcome> {
  // Layer 1: the quick ticket check (most double clicks stop here).
  const earlier = await findEarlierSave(save.reviewId);
  if (earlier !== null) {
    return { kind: "alreadySaved", result: earlier };
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Layer 2: inside the transaction, so a customer deleted a moment
        // ago is noticed here instead of failing halfway.
        const wanted = chosenExistingIds(save.items);
        const found = await tx.customer.findMany({ where: { id: { in: wanted } }, select: { id: true } });
        const foundIds = new Set(found.map((customer) => customer.id));
        const missing = wanted.filter((id) => !foundIds.has(id));
        if (missing.length > 0) {
          throw new UnknownCustomersError(missing); // undoes the transaction
        }

        // Layer 3: everything together, the ticket last.
        const items: SavedItem[] = [];
        for (const item of save.items) {
          items.push(await saveItem(tx, item, now));
        }
        const saveResult: SaveResult = { items };
        await tx.aiSave.create({ data: { id: save.reviewId, result: saveResult } });
        return saveResult;
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    );
    return { kind: "saved", result };
  } catch (error) {
    if (error instanceof UnknownCustomersError) {
      return { kind: "unknownCustomers", ids: error.ids };
    }
    // Another Save of the same review won the race: ours was undone.
    if (isDuplicateTicket(error)) {
      const winner = await findEarlierSave(save.reviewId);
      if (winner !== null) {
        return { kind: "alreadySaved", result: winner };
      }
    }
    throw error;
  }
}
