// Tests for checking the confirmed review sent to POST /ai/save (pure logic).
import { describe, expect, it } from "vitest";
import { MAX_CUSTOMERS_PER_SAVE, MAX_FOLLOW_UPS_PER_CUSTOMER, validateConfirmedSave } from "./saveValidation.js";

const REVIEW_ID = "a3f9c2e1-5b7d-4c8e-9f1a-2b3c4d5e6f70";

const ORCHID_ITEM = {
  customer: { existingId: 39 },
  interaction: { type: "MEETING", summary: "Met Vikram." },
  followUps: [{ title: "Send quote", dueDate: "2026-11-02", priority: "HIGH" }],
};

const NOVA_ITEM = {
  customer: { createNew: { companyName: "Nova Tech", contactName: "Kiran" } },
  interaction: null,
  followUps: [{ title: "Arrange a demo", dueDate: "2026-11-02", priority: "MEDIUM" }],
};

/** A save body with these customers (a valid review id unless replaced). */
function save(customers: unknown[], reviewId: unknown = REVIEW_ID) {
  return validateConfirmedSave({ reviewId, customers });
}

/** Just the errors (an empty list means the body was fine). */
function errorsOf(result: ReturnType<typeof validateConfirmedSave>): string[] {
  return result.ok ? [] : result.errors;
}

describe("validateConfirmedSave: a good review", () => {
  it("accepts an existing and a new customer, each with its own actions", () => {
    const result = save([ORCHID_ITEM, NOVA_ITEM]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [orchid, nova] = result.data.items;
    expect(orchid?.customer).toEqual({ kind: "existing", id: 39 });
    expect(orchid?.interaction).toEqual({ type: "MEETING", summary: "Met Vikram." });
    expect(orchid?.followUps).toEqual([{ title: "Send quote", dueDate: new Date("2026-11-02T00:00:00.000Z"), priority: "HIGH" }]);
    expect(nova?.customer).toEqual({ kind: "new", data: { companyName: "Nova Tech", contactName: "Kiran" } });
    expect(nova?.interaction).toBeNull();
  });

  it("accepts a new customer with nothing else (just create the customer)", () => {
    expect(save([{ customer: { createNew: { companyName: "Nova Tech" } } }]).ok).toBe(true);
  });

  it("accepts a past due date (the user saw the warning and kept it, like in the forms)", () => {
    expect(save([{ ...ORCHID_ITEM, followUps: [{ title: "Call", dueDate: "2026-01-05" }] }]).ok).toBe(true);
  });
});

describe("validateConfirmedSave: the customer must be resolved", () => {
  // Spec scenario 9: saving while the customer is still ambiguous.
  it("refuses to save when the user has not chosen a customer", () => {
    expect(errorsOf(save([{ ...ORCHID_ITEM, customer: null }]))).toEqual([
      "Customer 1: choose a customer or create a new one",
    ]);
    expect(errorsOf(save([{ interaction: ORCHID_ITEM.interaction }]))).toEqual([
      "Customer 1: choose a customer or create a new one",
    ]);
  });

  it("saves NOTHING when only one of several customers is unresolved", () => {
    const result = save([ORCHID_ITEM, { ...NOVA_ITEM, customer: null }]);
    expect(result.ok).toBe(false);
    expect(errorsOf(result)).toEqual(["Customer 2: choose a customer or create a new one"]);
  });

  it("needs exactly one of existingId or createNew", () => {
    expect(errorsOf(save([{ ...ORCHID_ITEM, customer: {} }]))).toEqual([
      "Customer 1: customer needs exactly one of existingId or createNew",
    ]);
    expect(errorsOf(save([{ ...ORCHID_ITEM, customer: { existingId: 39, createNew: { companyName: "X" } } }]))).toEqual([
      "Customer 1: customer needs exactly one of existingId or createNew",
    ]);
  });

  // Spec scenario 8 (format part): any EXISTING id is allowed, even one that
  // was not offered (owner rule C). Whether it exists is checked when saving.
  it("accepts an id that was not among the options, if it is a valid id", () => {
    expect(save([{ ...ORCHID_ITEM, customer: { existingId: 12345 } }]).ok).toBe(true);
  });

  it.each([[0], [-3], [1.5], ["39"]])("rejects the existingId %s", (existingId) => {
    expect(errorsOf(save([{ ...ORCHID_ITEM, customer: { existingId } }]))).toEqual([
      "Customer 1: existingId must be a positive whole number",
    ]);
  });

  it("checks a new customer with the normal customer rules", () => {
    const errors = errorsOf(save([{ ...NOVA_ITEM, customer: { createNew: { companyName: "  ", email: "kiran at nova" } } }]));
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/^Customer 1 \(new customer\): companyName/);
    expect(errors[1]).toMatch(/^Customer 1 \(new customer\): email/);
  });

  it("refuses an existing customer with nothing to save", () => {
    expect(errorsOf(save([{ customer: { existingId: 39 }, interaction: null, followUps: [] }]))).toEqual([
      "Customer 1: nothing to save (no interaction and no follow-ups)",
    ]);
  });
});

describe("validateConfirmedSave: interactions and follow-ups", () => {
  it("needs a type and a summary for an interaction", () => {
    expect(errorsOf(save([{ ...ORCHID_ITEM, interaction: {} }]))).toEqual([
      "Customer 1 (interaction): type is required",
      "Customer 1 (interaction): summary is required",
    ]);
  });

  it("only allows the CRM's interaction types", () => {
    const errors = errorsOf(save([{ ...ORCHID_ITEM, interaction: { type: "LUNCH", summary: "Ate." } }]));
    expect(errors).toEqual(["Customer 1 (interaction): type must be one of: CALL, EMAIL, MEETING, NOTE"]);
  });

  it("needs a title and a real due date for each follow-up", () => {
    const errors = errorsOf(save([{ ...ORCHID_ITEM, followUps: [{ priority: "HIGH" }, { title: "Call", dueDate: "2026-02-31" }] }]));
    expect(errors).toEqual([
      "Customer 1 (follow-up 1): title is required",
      "Customer 1 (follow-up 1): dueDate is required",
      'Customer 1 (follow-up 2): dueDate must be a date like "2026-10-30"',
    ]);
  });

  it("limits the number of follow-ups per customer", () => {
    const many = Array.from({ length: MAX_FOLLOW_UPS_PER_CUSTOMER + 1 }, () => ORCHID_ITEM.followUps[0]);
    expect(errorsOf(save([{ ...ORCHID_ITEM, followUps: many }]))).toEqual([
      `Customer 1: at most ${MAX_FOLLOW_UPS_PER_CUSTOMER} follow-ups per customer`,
    ]);
  });
});

describe("validateConfirmedSave: the whole body", () => {
  it("needs the review id from /ai/understand", () => {
    expect(errorsOf(validateConfirmedSave({ customers: [ORCHID_ITEM] }))).toEqual(["reviewId must be the id given by /ai/understand"]);
    expect(errorsOf(save([ORCHID_ITEM], null))).toEqual(["reviewId must be the id given by /ai/understand"]);
    expect(errorsOf(save([ORCHID_ITEM], "12345"))).toEqual(["reviewId must be the id given by /ai/understand"]);
  });

  it("needs at least one customer, and at most the limit", () => {
    expect(errorsOf(save([]))).toEqual(["customers must be a list with at least one customer"]);
    const many = Array.from({ length: MAX_CUSTOMERS_PER_SAVE + 1 }, () => ORCHID_ITEM);
    expect(errorsOf(save(many))).toEqual([`at most ${MAX_CUSTOMERS_PER_SAVE} customers can be saved at once`]);
  });

  it("rejects unknown fields (the browser cannot sneak in an id or a date)", () => {
    const errors = errorsOf(validateConfirmedSave({ reviewId: REVIEW_ID, customers: [{ ...ORCHID_ITEM, createdBy: 1 }], admin: true }));
    expect(errors).toEqual(["Request: unknown field admin", "Customer 1: unknown field createdBy"]);
  });

  it("rejects a body that is not an object", () => {
    expect(errorsOf(validateConfirmedSave("save please"))).toEqual(["Request body must be a JSON object"]);
  });
});
