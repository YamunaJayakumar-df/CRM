// Tests for the interaction body validators. These are plain functions (no HTTP,
// no database), so we call them directly and look at the result.
// They protect the rules for what a client may send when logging or editing
// an interaction (a call, email, meeting or note with a customer).
import { describe, it, expect } from "vitest";
import {
  validateCreateInteraction,
  validateUpdateInteraction,
} from "./interactionValidation.js";

// The exact error messages, written once so the tests stay readable.
const TYPE_ERROR = "type must be one of: CALL, EMAIL, MEETING, NOTE";
const OCCURRED_AT_ERROR =
  'occurredAt must be a date-time with a timezone, like "2026-10-26T10:30:00Z"';

// A valid create body; tests copy it and change one thing.
const validBody = { customerId: 12, type: "CALL", summary: "Discussed renewal" };

describe("validateCreateInteraction: valid bodies", () => {
  // Protects the smallest valid request; occurredAt is left out (the route fills in "now").
  it("accepts customerId, type and summary without occurredAt", () => {
    const result = validateCreateInteraction(validBody);

    expect(result).toEqual({ ok: true, data: validBody });
    expect(result.ok && "occurredAt" in result.data).toBe(false);
  });

  // Protects that occurredAt with a timezone becomes the correct moment in time.
  it("accepts occurredAt with an offset and returns it as the right Date", () => {
    const result = validateCreateInteraction({
      ...validBody,
      occurredAt: "2026-10-26T16:00:00+05:30",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.occurredAt).toBeInstanceOf(Date);
    // 16:00 in India (+05:30) is 10:30 in UTC.
    expect(result.data.occurredAt?.toISOString()).toBe("2026-10-26T10:30:00.000Z");
  });

  // Protects that "Z" (UTC) and a missing seconds part are both accepted.
  it("accepts occurredAt in UTC without seconds", () => {
    const result = validateCreateInteraction({
      ...validBody,
      occurredAt: "2026-10-26T10:30Z",
    });

    expect(result.ok && result.data.occurredAt?.toISOString()).toBe(
      "2026-10-26T10:30:00.000Z",
    );
  });

  // Protects that stray spaces typed by users are not saved.
  it("trims spaces from summary", () => {
    const result = validateCreateInteraction({
      ...validBody,
      summary: "   Discussed renewal  ",
    });

    expect(result).toEqual({ ok: true, data: validBody });
  });

  // Protects that a summary may have several lines (meeting notes, etc.).
  it("allows line breaks and tabs in summary", () => {
    const summary = "Line 1\nLine 2\r\n\tindented";

    const result = validateCreateInteraction({ ...validBody, summary });

    // "\r\n" from browsers is stored as "\n".
    expect(result).toEqual({
      ok: true,
      data: { ...validBody, summary: "Line 1\nLine 2\n\tindented" },
    });
  });

  // Protects that every allowed type is accepted.
  it("accepts every interaction type", () => {
    for (const type of ["CALL", "EMAIL", "MEETING", "NOTE"]) {
      const result = validateCreateInteraction({ ...validBody, type });

      expect(result.ok).toBe(true);
    }
  });
});

describe("validateCreateInteraction: required fields", () => {
  // Protects each required field on its own.
  it("rejects a body without customerId", () => {
    const result = validateCreateInteraction({ type: "CALL", summary: "Hi" });

    expect(result).toEqual({ ok: false, errors: ["customerId is required"] });
  });

  it("rejects a body without type", () => {
    const result = validateCreateInteraction({ customerId: 12, summary: "Hi" });

    expect(result).toEqual({ ok: false, errors: ["type is required"] });
  });

  it("rejects a body without summary", () => {
    const result = validateCreateInteraction({ customerId: 12, type: "CALL" });

    expect(result).toEqual({ ok: false, errors: ["summary is required"] });
  });

  // Protects that an empty object lists all three missing fields at once.
  it("lists every missing field for an empty body", () => {
    const result = validateCreateInteraction({});

    expect(result).toEqual({
      ok: false,
      errors: [
        "customerId is required",
        "type is required",
        "summary is required",
      ],
    });
  });
});

describe("validateCreateInteraction: customerId", () => {
  // Protects that customerId must be a real JSON number id, not text or decimals.
  it("rejects customerId as a string, 0 or a decimal", () => {
    for (const customerId of ["12", 0, 1.5]) {
      const result = validateCreateInteraction({ ...validBody, customerId });

      expect(result).toEqual({
        ok: false,
        errors: ["customerId must be a positive whole number"],
      });
    }
  });
});

describe("validateCreateInteraction: type", () => {
  // Protects that type must match the database enum exactly (uppercase),
  // and that the error tells the user which values are allowed.
  it("rejects lowercase, unknown and null types", () => {
    for (const type of ["call", "FAX", null]) {
      const result = validateCreateInteraction({ ...validBody, type });

      expect(result).toEqual({ ok: false, errors: [TYPE_ERROR] });
    }
  });
});

describe("validateCreateInteraction: summary", () => {
  // Protects against a blank summary.
  it("rejects an empty or whitespace-only summary", () => {
    for (const summary of ["", "   \n\t "]) {
      const result = validateCreateInteraction({ ...validBody, summary });

      expect(result).toEqual({ ok: false, errors: ["summary cannot be empty"] });
    }
  });

  // Protects against numbers, null or other non-text summaries.
  it("rejects a non-string summary", () => {
    for (const summary of [123, null, ["text"]]) {
      const result = validateCreateInteraction({ ...validBody, summary });

      expect(result).toEqual({ ok: false, errors: ["summary must be a string"] });
    }
  });

  // Protects against NUL, which Postgres refuses (would cause a 500 error).
  it("rejects a NUL character in summary", () => {
    const result = validateCreateInteraction({
      ...validBody,
      summary: "Called\u0000",
    });

    expect(result).toEqual({
      ok: false,
      errors: ["summary contains invalid characters"],
    });
  });

  // Protects the length limit: 5000 characters OK, 5001 rejected.
  it("enforces the 5000 character limit", () => {
    const atLimit = validateCreateInteraction({
      ...validBody,
      summary: "s".repeat(5000),
    });
    const overLimit = validateCreateInteraction({
      ...validBody,
      summary: "s".repeat(5001),
    });

    expect(atLimit.ok).toBe(true);
    expect(overLimit).toEqual({
      ok: false,
      errors: ["summary must be at most 5000 characters"],
    });
  });
});

describe("validateCreateInteraction: occurredAt", () => {
  // Protects against ambiguous or broken date-times. Without a timezone the
  // server would guess; impossible dates/hours must not be "rolled over".
  const badValues: Array<[string, unknown]> = [
    ["no timezone", "2026-10-26T10:30"],
    ["date only", "2026-10-26"],
    ["garbage text", "yesterday"],
    ["null", null],
    ["a number", 1761474600000],
    ["31 February", "2026-02-31T10:00:00Z"],
    ["hour 25", "2026-10-26T25:00:00Z"],
  ];

  for (const [label, occurredAt] of badValues) {
    it(`rejects occurredAt: ${label}`, () => {
      const result = validateCreateInteraction({ ...validBody, occurredAt });

      expect(result).toEqual({ ok: false, errors: [OCCURRED_AT_ERROR] });
    });
  }
});

describe("validateCreateInteraction: body shape", () => {
  // Protects against clients choosing their own id or timestamps.
  it("rejects unknown fields", () => {
    const result = validateCreateInteraction({
      ...validBody,
      id: 99,
      createdAt: "2020-01-01",
    });

    expect(result).toEqual({
      ok: false,
      errors: ["Unknown field: id", "Unknown field: createdAt"],
    });
  });

  // Protects against bodies that are not JSON objects at all.
  it("rejects bodies that are not objects", () => {
    for (const body of [undefined, null, [], [validBody], "CALL", 42]) {
      const result = validateCreateInteraction(body);

      expect(result).toEqual({
        ok: false,
        errors: ["Request body must be a JSON object"],
      });
    }
  });

  // Protects that the user sees EVERY problem at once, not one at a time.
  it("collects all errors in one result", () => {
    const result = validateCreateInteraction({
      id: 1,
      customerId: "12",
      type: "call",
      summary: "",
      occurredAt: "garbage",
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        "Unknown field: id",
        TYPE_ERROR,
        "summary cannot be empty",
        OCCURRED_AT_ERROR,
        "customerId must be a positive whole number",
      ],
    });
  });
});

describe("validateUpdateInteraction", () => {
  // Protects partial updates: sending one field changes only that field.
  it("accepts a body with a single field", () => {
    const result = validateUpdateInteraction({ summary: "  Follow-up call  " });

    expect(result).toEqual({ ok: true, data: { summary: "Follow-up call" } });
  });

  // Protects that occurredAt can be corrected and comes back as a Date.
  it("accepts a new occurredAt", () => {
    const result = validateUpdateInteraction({
      occurredAt: "2026-10-26T10:30:00Z",
    });

    expect(result).toEqual({
      ok: true,
      data: { occurredAt: new Date("2026-10-26T10:30:00.000Z") },
    });
  });

  // Protects against "update" requests that would change nothing.
  it("rejects an empty body", () => {
    const result = validateUpdateInteraction({});

    expect(result).toEqual({
      ok: false,
      errors: ["Provide at least one field to update"],
    });
  });

  // Protects that an interaction cannot be moved to another customer.
  it("rejects customerId with a clear message", () => {
    const result = validateUpdateInteraction({ customerId: 5, summary: "Hi" });

    expect(result).toEqual({
      ok: false,
      errors: ["customerId cannot be changed"],
    });
  });

  // Protects that a body with ONLY customerId gets both helpful errors.
  it("rejects a body with only customerId", () => {
    const result = validateUpdateInteraction({ customerId: 5 });

    expect(result).toEqual({
      ok: false,
      errors: [
        "customerId cannot be changed",
        "Provide at least one field to update",
      ],
    });
  });

  // Protects that required values cannot be cleared with null on update.
  it("rejects null type and null occurredAt", () => {
    const result = validateUpdateInteraction({ type: null, occurredAt: null });

    expect(result).toEqual({
      ok: false,
      errors: [TYPE_ERROR, OCCURRED_AT_ERROR],
    });
  });

  // Protects against changing id or timestamps through an update.
  it("rejects unknown fields", () => {
    const result = validateUpdateInteraction({ type: "NOTE", id: 7 });

    expect(result).toEqual({ ok: false, errors: ["Unknown field: id"] });
  });

  // Protects against bodies that are not JSON objects at all.
  it("rejects bodies that are not objects", () => {
    for (const body of [undefined, null, [], "NOTE"]) {
      const result = validateUpdateInteraction(body);

      expect(result).toEqual({
        ok: false,
        errors: ["Request body must be a JSON object"],
      });
    }
  });
});

describe("summary line breaks", () => {
  // Protects that the title (first line) never ends in a hidden "\r".
  it("stores browser \\r\\n line breaks as \\n", () => {
    const result = validateUpdateInteraction({ summary: "Kickoff\r\nNext steps" });

    expect(result).toEqual({ ok: true, data: { summary: "Kickoff\nNext steps" } });
  });
});
