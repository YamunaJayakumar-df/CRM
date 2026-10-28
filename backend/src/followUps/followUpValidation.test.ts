// Tests for the follow-up body validators. These are plain functions (no HTTP,
// no database), so we call them directly and look at the result.
// They protect the rules for what a client may send when creating or editing
// a follow-up (a task like "Send quote" due on a certain day).
import { describe, it, expect } from "vitest";
import {
  validateCreateFollowUp,
  validateUpdateFollowUp,
} from "./followUpValidation.js";

// The exact error messages, written once so the tests stay readable.
const DUE_DATE_ERROR = 'dueDate must be a date like "2026-10-30"';
const STATUS_ERROR = "status must be one of: OPEN, DONE";
const CUSTOMER_ID_ERROR = "customerId must be a positive whole number";
const NOT_AN_OBJECT_ERROR = "Request body must be a JSON object";

// A valid create body; tests copy it and change one thing.
const validBody = { customerId: 12, title: "Send quote", dueDate: "2026-10-30" };

// What validBody looks like after validation: dueDate becomes midnight UTC.
const validData = {
  customerId: 12,
  title: "Send quote",
  dueDate: new Date("2026-10-30T00:00:00.000Z"),
};

describe("validateCreateFollowUp: valid bodies", () => {
  // Protects the smallest valid request. status and notes are left out,
  // so the database default (OPEN) is used.
  it("accepts customerId, title and dueDate, and turns dueDate into midnight UTC", () => {
    const result = validateCreateFollowUp(validBody);

    expect(result).toEqual({ ok: true, data: validData });
    expect(result.ok && "status" in result.data).toBe(false);
    expect(result.ok && "notes" in result.data).toBe(false);
  });

  // Protects that every field can be sent together.
  it("accepts status DONE and notes", () => {
    const result = validateCreateFollowUp({
      ...validBody,
      status: "DONE",
      notes: "Already sent by email",
    });

    expect(result).toEqual({
      ok: true,
      data: { ...validData, status: "DONE", notes: "Already sent by email" },
    });
  });

  // Protects that stray spaces typed by users are not saved.
  it("trims spaces from title and notes", () => {
    const result = validateCreateFollowUp({
      ...validBody,
      title: "   Send quote  ",
      notes: "  Call first  ",
    });

    expect(result).toEqual({
      ok: true,
      data: { ...validData, notes: "Call first" },
    });
  });

  // Protects that empty notes mean "no notes" (null), not an empty string.
  it("turns empty or whitespace-only notes into null", () => {
    for (const notes of ["", "   \n "]) {
      const result = validateCreateFollowUp({ ...validBody, notes });

      expect(result).toEqual({ ok: true, data: { ...validData, notes: null } });
    }
  });

  // Protects that notes can be explicitly set to null.
  it("accepts notes: null", () => {
    const result = validateCreateFollowUp({ ...validBody, notes: null });

    expect(result).toEqual({ ok: true, data: { ...validData, notes: null } });
  });

  // Protects that notes may have several lines.
  it("allows line breaks and tabs in notes", () => {
    const notes = "Line 1\nLine 2\r\n\tindented";

    const result = validateCreateFollowUp({ ...validBody, notes });

    // "\r\n" from browsers is stored as "\n".
    expect(result).toEqual({
      ok: true,
      data: { ...validData, notes: "Line 1\nLine 2\n\tindented" },
    });
  });
});

describe("validateCreateFollowUp: required fields", () => {
  // Protects each required field on its own.
  it("rejects a body without customerId", () => {
    const result = validateCreateFollowUp({ title: "Send quote", dueDate: "2026-10-30" });

    expect(result).toEqual({ ok: false, errors: ["customerId is required"] });
  });

  it("rejects a body without title", () => {
    const result = validateCreateFollowUp({ customerId: 12, dueDate: "2026-10-30" });

    expect(result).toEqual({ ok: false, errors: ["title is required"] });
  });

  it("rejects a body without dueDate", () => {
    const result = validateCreateFollowUp({ customerId: 12, title: "Send quote" });

    expect(result).toEqual({ ok: false, errors: ["dueDate is required"] });
  });

  // Protects that an empty object lists all three missing fields at once.
  it("lists every missing field for an empty body", () => {
    const result = validateCreateFollowUp({});

    expect(result).toEqual({
      ok: false,
      errors: ["customerId is required", "title is required", "dueDate is required"],
    });
  });
});

describe("validateCreateFollowUp: customerId", () => {
  // Protects that customerId must be a real JSON number id, not text or decimals.
  for (const customerId of ["12", 0, 1.5]) {
    it(`rejects customerId ${JSON.stringify(customerId)}`, () => {
      const result = validateCreateFollowUp({ ...validBody, customerId });

      expect(result).toEqual({ ok: false, errors: [CUSTOMER_ID_ERROR] });
    });
  }
});

describe("validateCreateFollowUp: title", () => {
  // Protects that a title stays on one line (and NUL, which Postgres refuses).
  for (const [label, title] of [
    ["a line break", "Send\nquote"],
    ["a NUL character", "Send quote\u0000"],
  ]) {
    it(`rejects a title with ${label}`, () => {
      const result = validateCreateFollowUp({ ...validBody, title });

      expect(result).toEqual({
        ok: false,
        errors: ["title contains invalid characters"],
      });
    });
  }

  // Protects against a blank title.
  it("rejects an empty or whitespace-only title", () => {
    for (const title of ["", "    "]) {
      const result = validateCreateFollowUp({ ...validBody, title });

      expect(result).toEqual({ ok: false, errors: ["title cannot be empty"] });
    }
  });

  // Protects the length limit: 200 characters OK, 201 rejected.
  it("enforces the 200 character limit", () => {
    const atLimit = validateCreateFollowUp({ ...validBody, title: "t".repeat(200) });
    const overLimit = validateCreateFollowUp({ ...validBody, title: "t".repeat(201) });

    expect(atLimit.ok).toBe(true);
    expect(overLimit).toEqual({
      ok: false,
      errors: ["title must be at most 200 characters"],
    });
  });
});

describe("validateCreateFollowUp: notes", () => {
  // Protects the length limit: 5000 characters OK, 5001 rejected.
  it("enforces the 5000 character limit", () => {
    const atLimit = validateCreateFollowUp({ ...validBody, notes: "n".repeat(5000) });
    const overLimit = validateCreateFollowUp({ ...validBody, notes: "n".repeat(5001) });

    expect(atLimit.ok).toBe(true);
    expect(overLimit).toEqual({
      ok: false,
      errors: ["notes must be at most 5000 characters"],
    });
  });
});

describe("validateCreateFollowUp: dueDate", () => {
  // Protects that dueDate is a plain, real calendar day: no time part,
  // no other formats, no impossible days and no typo years.
  const badValues: Array<[string, unknown]> = [
    ["31 February", "2026-02-31"],
    ["a date with a time", "2026-10-30T10:00:00Z"],
    ["day-month-year order", "30-10-2026"],
    ["null", null],
    ["a number", 20261030],
    ["year 0226 (typo)", "0226-10-30"],
  ];

  for (const [label, dueDate] of badValues) {
    it(`rejects dueDate: ${label}`, () => {
      const result = validateCreateFollowUp({ ...validBody, dueDate });

      expect(result).toEqual({ ok: false, errors: [DUE_DATE_ERROR] });
    });
  }
});

describe("validateCreateFollowUp: status", () => {
  // Protects that status must match the database enum exactly (uppercase).
  for (const status of ["open", "CLOSED", null]) {
    it(`rejects status ${JSON.stringify(status)}`, () => {
      const result = validateCreateFollowUp({ ...validBody, status });

      expect(result).toEqual({ ok: false, errors: [STATUS_ERROR] });
    });
  }
});

describe("validateCreateFollowUp: body shape", () => {
  // Protects against clients choosing their own id or timestamps.
  it("rejects unknown fields", () => {
    const result = validateCreateFollowUp({ ...validBody, id: 99 });

    expect(result).toEqual({ ok: false, errors: ["Unknown field: id"] });
  });

  // Protects against bodies that are not JSON objects at all.
  it("rejects bodies that are not objects", () => {
    for (const body of [undefined, null, [], [validBody], "Send quote", 42]) {
      const result = validateCreateFollowUp(body);

      expect(result).toEqual({ ok: false, errors: [NOT_AN_OBJECT_ERROR] });
    }
  });

  // Protects that the user sees EVERY problem at once, not one at a time.
  it("collects all errors in one result", () => {
    const result = validateCreateFollowUp({
      id: 1,
      customerId: "12",
      title: "",
      dueDate: "tomorrow",
      status: "open",
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        "Unknown field: id",
        "title cannot be empty",
        DUE_DATE_ERROR,
        STATUS_ERROR,
        CUSTOMER_ID_ERROR,
      ],
    });
  });
});

describe("validateUpdateFollowUp", () => {
  // Protects partial updates: sending one field changes only that field.
  it("accepts only a title (trimmed)", () => {
    const result = validateUpdateFollowUp({ title: "  Call back  " });

    expect(result).toEqual({ ok: true, data: { title: "Call back" } });
  });

  it("accepts only a dueDate and turns it into midnight UTC", () => {
    const result = validateUpdateFollowUp({ dueDate: "2026-11-02" });

    expect(result).toEqual({
      ok: true,
      data: { dueDate: new Date("2026-11-02T00:00:00.000Z") },
    });
  });

  // Protects "mark as done", the most common update.
  it("accepts only a status", () => {
    const result = validateUpdateFollowUp({ status: "DONE" });

    expect(result).toEqual({ ok: true, data: { status: "DONE" } });
  });

  // Protects that notes can be cleared.
  it("accepts notes: null to clear the notes", () => {
    const result = validateUpdateFollowUp({ notes: null });

    expect(result).toEqual({ ok: true, data: { notes: null } });
  });

  // Protects against "update" requests that would change nothing.
  it("rejects an empty body", () => {
    const result = validateUpdateFollowUp({});

    expect(result).toEqual({
      ok: false,
      errors: ["Provide at least one field to update"],
    });
  });

  // Protects that a follow-up cannot be moved to another customer.
  it("rejects customerId with a clear message", () => {
    const result = validateUpdateFollowUp({ customerId: 5, title: "Hi" });

    expect(result).toEqual({ ok: false, errors: ["customerId cannot be changed"] });
  });

  // Protects that required values cannot be cleared with null on update.
  it("rejects null title, dueDate and status", () => {
    const result = validateUpdateFollowUp({ title: null, dueDate: null, status: null });

    expect(result).toEqual({
      ok: false,
      errors: ["title must be a string", DUE_DATE_ERROR, STATUS_ERROR],
    });
  });

  // Protects against changing id or timestamps through an update.
  it("rejects unknown fields", () => {
    const result = validateUpdateFollowUp({ status: "DONE", createdAt: "2020-01-01" });

    expect(result).toEqual({ ok: false, errors: ["Unknown field: createdAt"] });
  });

  // Protects against bodies that are not JSON objects at all.
  it("rejects bodies that are not objects", () => {
    for (const body of [undefined, null, [], "DONE"]) {
      const result = validateUpdateFollowUp(body);

      expect(result).toEqual({ ok: false, errors: [NOT_AN_OBJECT_ERROR] });
    }
  });
});

describe("follow-up priority", () => {
  const PRIORITY_ERROR = "priority must be one of: LOW, MEDIUM, HIGH";

  // Protects that every priority can be chosen when creating a follow-up.
  for (const priority of ["LOW", "MEDIUM", "HIGH"]) {
    it(`accepts priority ${priority} on create`, () => {
      const result = validateCreateFollowUp({ ...validBody, priority });

      expect(result).toEqual({ ok: true, data: { ...validData, priority } });
    });

    // Protects that priority alone is a valid update.
    it(`accepts priority ${priority} on update`, () => {
      const result = validateUpdateFollowUp({ priority });

      expect(result).toEqual({ ok: true, data: { priority } });
    });
  }

  // Protects that leaving priority out lets the database default (MEDIUM) apply.
  it("leaves priority out of the data when it is not sent on create", () => {
    const result = validateCreateFollowUp(validBody);

    expect(result.ok && "priority" in result.data).toBe(false);
  });

  // Protects that priority must match the database enum exactly: lowercase,
  // unknown words, null (every follow-up has a priority) and numbers are rejected.
  for (const priority of ["high", "URGENT", null, 1]) {
    it(`rejects priority ${JSON.stringify(priority)}`, () => {
      const created = validateCreateFollowUp({ ...validBody, priority });
      const updated = validateUpdateFollowUp({ priority });

      expect(created).toEqual({ ok: false, errors: [PRIORITY_ERROR] });
      expect(updated).toEqual({ ok: false, errors: [PRIORITY_ERROR] });
    });
  }
});
