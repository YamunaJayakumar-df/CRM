// Tests for the customer body validators. These are plain functions (no HTTP,
// no database), so we call them directly and look at the result.
// They protect the rules for what a client is allowed to send when creating
// or updating a customer.
import { describe, it, expect } from "vitest";
import {
  validateCreateCustomer,
  validateUpdateCustomer,
} from "./customerValidation.js";

describe("validateCreateCustomer", () => {
  // Protects the smallest valid request: only the required companyName.
  it("accepts a body with only companyName", () => {
    const result = validateCreateCustomer({ companyName: "Acme Ltd" });

    expect(result).toEqual({ ok: true, data: { companyName: "Acme Ltd" } });
  });

  // Protects that every allowed field is passed through when valid.
  it("accepts a body with every allowed field", () => {
    const body = {
      companyName: "Acme Ltd",
      contactName: "Jane Doe",
      website: "acme.com",
      email: "jane@acme.com",
      phone: "+44 20 1234 5678",
      notes: "Prefers email.",
    };

    const result = validateCreateCustomer(body);

    expect(result).toEqual({ ok: true, data: body });
  });

  // Protects that stray spaces typed by users are not saved to the database.
  it("trims spaces from every text field", () => {
    const result = validateCreateCustomer({
      companyName: "  Acme Ltd  ",
      contactName: " Jane ",
      email: " jane@acme.com ",
      phone: " 123 ",
      notes: "  hello  ",
    });

    expect(result).toEqual({
      ok: true,
      data: {
        companyName: "Acme Ltd",
        contactName: "Jane",
        email: "jane@acme.com",
        phone: "123",
        notes: "hello",
      },
    });
  });

  // Protects that an empty optional field means "no value" (null), not "".
  it("turns empty or whitespace-only optional fields into null", () => {
    const result = validateCreateCustomer({
      companyName: "Acme Ltd",
      contactName: "",
      email: "   ",
    });

    expect(result).toEqual({
      ok: true,
      data: { companyName: "Acme Ltd", contactName: null, email: null },
    });
  });

  // Protects that clients may explicitly send null for optional fields.
  it("accepts null for optional fields", () => {
    const result = validateCreateCustomer({
      companyName: "Acme Ltd",
      contactName: null,
      email: null,
      phone: null,
      notes: null,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        companyName: "Acme Ltd",
        contactName: null,
        email: null,
        phone: null,
        notes: null,
      },
    });
  });

  // Protects the one required field.
  it("rejects a body without companyName", () => {
    const result = validateCreateCustomer({ contactName: "Jane" });

    expect(result).toEqual({ ok: false, errors: ["companyName is required"] });
  });

  // Protects against a blank company name.
  it("rejects an empty companyName", () => {
    const result = validateCreateCustomer({ companyName: "" });

    expect(result).toEqual({
      ok: false,
      errors: ["companyName cannot be empty"],
    });
  });

  // Protects against a company name made only of spaces.
  it("rejects a whitespace-only companyName", () => {
    const result = validateCreateCustomer({ companyName: "    " });

    expect(result).toEqual({
      ok: false,
      errors: ["companyName cannot be empty"],
    });
  });

  // Protects that companyName cannot be null (it is required, unlike the others).
  it("rejects a null companyName", () => {
    const result = validateCreateCustomer({ companyName: null });

    expect(result).toEqual({
      ok: false,
      errors: ["companyName must be a string"],
    });
  });

  // Protects against numbers or other non-text values in companyName.
  it("rejects a non-string companyName", () => {
    const result = validateCreateCustomer({ companyName: 123 });

    expect(result).toEqual({
      ok: false,
      errors: ["companyName must be a string"],
    });
  });

  // Protects against wrong types in optional fields.
  it("rejects non-string optional fields", () => {
    const result = validateCreateCustomer({
      companyName: "Acme Ltd",
      contactName: 5,
      email: true,
      phone: ["123"],
      notes: { text: "hi" },
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        "contactName must be a string or null",
        "email must be a string or null",
        "phone must be a string or null",
        "notes must be a string or null",
      ],
    });
  });

  // Protects the companyName length limit: exactly 200 characters is allowed.
  it("accepts a companyName of exactly 200 characters", () => {
    const result = validateCreateCustomer({ companyName: "a".repeat(200) });

    expect(result.ok).toBe(true);
  });

  // Protects the companyName length limit: 201 characters is rejected.
  it("rejects a companyName of 201 characters", () => {
    const result = validateCreateCustomer({ companyName: "a".repeat(201) });

    expect(result).toEqual({
      ok: false,
      errors: ["companyName must be at most 200 characters"],
    });
  });

  // Protects that the limit counts characters AFTER trimming spaces.
  it("measures length after trimming", () => {
    const result = validateCreateCustomer({
      companyName: "   " + "a".repeat(200) + "   ",
    });

    expect(result.ok).toBe(true);
  });

  // Protects the contactName length limit (200 OK, 201 rejected).
  it("enforces the 200 character limit on contactName", () => {
    const atLimit = validateCreateCustomer({
      companyName: "Acme",
      contactName: "a".repeat(200),
    });
    const overLimit = validateCreateCustomer({
      companyName: "Acme",
      contactName: "a".repeat(201),
    });

    expect(atLimit.ok).toBe(true);
    expect(overLimit).toEqual({
      ok: false,
      errors: ["contactName must be at most 200 characters"],
    });
  });

  // Protects the phone length limit (50 OK, 51 rejected).
  it("enforces the 50 character limit on phone", () => {
    const atLimit = validateCreateCustomer({
      companyName: "Acme",
      phone: "1".repeat(50),
    });
    const overLimit = validateCreateCustomer({
      companyName: "Acme",
      phone: "1".repeat(51),
    });

    expect(atLimit.ok).toBe(true);
    expect(overLimit).toEqual({
      ok: false,
      errors: ["phone must be at most 50 characters"],
    });
  });

  // Protects the notes length limit (5000 OK, 5001 rejected).
  it("enforces the 5000 character limit on notes", () => {
    const atLimit = validateCreateCustomer({
      companyName: "Acme",
      notes: "n".repeat(5000),
    });
    const overLimit = validateCreateCustomer({
      companyName: "Acme",
      notes: "n".repeat(5001),
    });

    expect(atLimit.ok).toBe(true);
    expect(overLimit).toEqual({
      ok: false,
      errors: ["notes must be at most 5000 characters"],
    });
  });

  // Protects the email length limit (254 OK, 255 rejected).
  it("enforces the 254 character limit on email", () => {
    const domain = "@example.com"; // 12 characters
    const atLimit = validateCreateCustomer({
      companyName: "Acme",
      email: "a".repeat(254 - domain.length) + domain,
    });
    const overLimit = validateCreateCustomer({
      companyName: "Acme",
      email: "a".repeat(255 - domain.length) + domain,
    });

    expect(atLimit.ok).toBe(true);
    expect(overLimit).toEqual({
      ok: false,
      errors: ["email must be at most 254 characters"],
    });
  });

  // Protects against obviously broken email addresses.
  it("rejects badly formed email addresses", () => {
    const badEmails = ["jane", "jane@", "@acme.com", "jane@acme", "ja ne@acme.com"];

    for (const email of badEmails) {
      const result = validateCreateCustomer({ companyName: "Acme", email });

      expect(result).toEqual({
        ok: false,
        errors: ["email must be a valid email address"],
      });
    }
  });

  // Protects against clients choosing their own id or timestamps.
  it("rejects unknown fields like id and createdAt", () => {
    const result = validateCreateCustomer({
      companyName: "Acme",
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
    const notObjects = [undefined, null, [], ["Acme"], "Acme", 42];

    for (const body of notObjects) {
      const result = validateCreateCustomer(body);

      expect(result).toEqual({
        ok: false,
        errors: ["Request body must be a JSON object"],
      });
    }
  });

  // Protects that the user sees EVERY problem at once, not one at a time.
  it("collects all errors in one result", () => {
    const result = validateCreateCustomer({
      id: 1,
      companyName: "",
      email: "not-an-email",
      phone: 12345,
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        "Unknown field: id",
        "companyName cannot be empty",
        "email must be a valid email address",
        "phone must be a string or null",
      ],
    });
  });
});

describe("validateUpdateCustomer", () => {
  // Protects partial updates: sending one field changes only that field.
  it("accepts a body with a single field", () => {
    const result = validateUpdateCustomer({ phone: " 555-1234 " });

    expect(result).toEqual({ ok: true, data: { phone: "555-1234" } });
  });

  // Protects that companyName is optional on update (unlike create).
  it("does not require companyName", () => {
    const result = validateUpdateCustomer({ notes: "Called today" });

    expect(result).toEqual({ ok: true, data: { notes: "Called today" } });
  });

  // Protects that an optional field can be cleared with null.
  it("accepts null to clear an optional field", () => {
    const result = validateUpdateCustomer({ email: null });

    expect(result).toEqual({ ok: true, data: { email: null } });
  });

  // Protects against "update" requests that would change nothing.
  it("rejects an empty body", () => {
    const result = validateUpdateCustomer({});

    expect(result).toEqual({
      ok: false,
      errors: ["Provide at least one field to update"],
    });
  });

  // Protects that companyName cannot be cleared on update.
  it("rejects a null companyName", () => {
    const result = validateUpdateCustomer({ companyName: null });

    expect(result).toEqual({
      ok: false,
      errors: ["companyName must be a string"],
    });
  });

  // Protects that companyName cannot be blanked on update.
  it("rejects an empty companyName", () => {
    const result = validateUpdateCustomer({ companyName: "  " });

    expect(result).toEqual({
      ok: false,
      errors: ["companyName cannot be empty"],
    });
  });

  // Protects against changing id or timestamps through an update.
  it("rejects unknown fields", () => {
    const result = validateUpdateCustomer({ companyName: "Acme", id: 7 });

    expect(result).toEqual({ ok: false, errors: ["Unknown field: id"] });
  });

  // Protects that a body with ONLY unknown fields gets both helpful errors.
  it("rejects a body with only unknown fields", () => {
    const result = validateUpdateCustomer({ createdAt: "2020-01-01" });

    expect(result).toEqual({
      ok: false,
      errors: [
        "Unknown field: createdAt",
        "Provide at least one field to update",
      ],
    });
  });

  // Protects against bodies that are not JSON objects at all.
  it("rejects bodies that are not objects", () => {
    const notObjects = [undefined, null, [], "Acme"];

    for (const body of notObjects) {
      const result = validateUpdateCustomer(body);

      expect(result).toEqual({
        ok: false,
        errors: ["Request body must be a JSON object"],
      });
    }
  });
});

describe("website field", () => {
  // Protects that a website is saved, without stray spaces. Any form people
  // type ("acme.com", "https://...") is fine; there is no URL format check.
  it("accepts a website and trims spaces", () => {
    const result = validateCreateCustomer({
      companyName: "Acme Ltd",
      website: "  https://www.acme.com  ",
    });

    expect(result).toEqual({
      ok: true,
      data: { companyName: "Acme Ltd", website: "https://www.acme.com" },
    });
  });

  // Protects that a blank website means "no website" (null), not "".
  it("turns an empty or whitespace-only website into null", () => {
    const empty = validateCreateCustomer({ companyName: "Acme", website: "" });
    const spaces = validateCreateCustomer({ companyName: "Acme", website: "   " });

    expect(empty).toEqual({ ok: true, data: { companyName: "Acme", website: null } });
    expect(spaces).toEqual({ ok: true, data: { companyName: "Acme", website: null } });
  });

  // Protects that clients may explicitly send null for website.
  it("accepts null", () => {
    const result = validateCreateCustomer({ companyName: "Acme", website: null });

    expect(result).toEqual({ ok: true, data: { companyName: "Acme", website: null } });
  });

  // Protects the website length limit (200 OK, 201 rejected).
  it("enforces the 200 character limit", () => {
    const atLimit = validateCreateCustomer({
      companyName: "Acme",
      website: "w".repeat(200),
    });
    const overLimit = validateCreateCustomer({
      companyName: "Acme",
      website: "w".repeat(201),
    });

    expect(atLimit.ok).toBe(true);
    expect(overLimit).toEqual({
      ok: false,
      errors: ["website must be at most 200 characters"],
    });
  });

  // Protects that website stays on one line (a tab is not allowed, unlike notes).
  it("rejects a tab", () => {
    const result = validateCreateCustomer({
      companyName: "Acme",
      website: "acme\t.com",
    });

    expect(result).toEqual({
      ok: false,
      errors: ["website contains invalid characters"],
    });
  });

  // Protects against NUL, which Postgres refuses (would cause a 500 error).
  it("rejects a NUL character", () => {
    const result = validateCreateCustomer({
      companyName: "Acme",
      website: "acme.com\u0000",
    });

    expect(result).toEqual({
      ok: false,
      errors: ["website contains invalid characters"],
    });
  });

  // Protects against numbers or other non-text values.
  it("rejects a number", () => {
    const result = validateCreateCustomer({ companyName: "Acme", website: 42 });

    expect(result).toEqual({
      ok: false,
      errors: ["website must be a string or null"],
    });
  });

  // Protects that website alone is a valid update (e.g. "add their website").
  it("is allowed as the only field in an update", () => {
    const result = validateUpdateCustomer({ website: " acme.com " });

    expect(result).toEqual({ ok: true, data: { website: "acme.com" } });
  });
});

describe("control characters in text fields", () => {
  // Protects against NUL, which Postgres refuses (would cause a 500 error).
  it("rejects a NUL character in companyName", () => {
    const result = validateCreateCustomer({ companyName: "Acme\u0000" });

    expect(result).toEqual({
      ok: false,
      errors: ["companyName contains invalid characters"],
    });
  });

  // Protects that single-line fields like phone stay on one line.
  it("rejects a tab in phone", () => {
    const result = validateUpdateCustomer({ phone: "123\t456" });

    expect(result).toEqual({
      ok: false,
      errors: ["phone contains invalid characters"],
    });
  });

  // Protects that notes may still have several lines.
  it("allows line breaks and tabs in notes", () => {
    const result = validateUpdateCustomer({ notes: "Line 1\nLine 2\tend" });

    expect(result).toEqual({
      ok: true,
      data: { notes: "Line 1\nLine 2\tend" },
    });
  });
});

describe("website scheme check", () => {
  // Protects the normal ways people type a website.
  it("accepts a plain domain and http(s) addresses", () => {
    for (const website of ["acme.com", "www.acme.com", "https://acme.com", "HTTP://acme.com"]) {
      expect(validateUpdateCustomer({ website })).toEqual({
        ok: true,
        data: { website },
      });
    }
  });

  // Protects against links that would run code if shown as a clickable link.
  it("rejects javascript: and data: values in any letter case", () => {
    for (const website of ["javascript:alert(1)", "JavaScript:alert(1)", "data:text/html,x"]) {
      expect(validateUpdateCustomer({ website })).toEqual({
        ok: false,
        errors: ["website must be a domain or an http(s):// address"],
      });
    }
  });
});

describe("industry field", () => {
  // Protects that an industry is saved, without stray spaces.
  it("accepts an industry and trims spaces", () => {
    const result = validateCreateCustomer({
      companyName: "Acme",
      industry: "  Healthcare  ",
    });

    expect(result).toEqual({
      ok: true,
      data: { companyName: "Acme", industry: "Healthcare" },
    });
  });

  // Protects that a blank industry means "no industry" (null), not "".
  it("turns an empty or whitespace-only industry into null", () => {
    for (const industry of ["", "   "]) {
      const result = validateCreateCustomer({ companyName: "Acme", industry });

      expect(result).toEqual({
        ok: true,
        data: { companyName: "Acme", industry: null },
      });
    }
  });

  // Protects that clients may explicitly send null for industry.
  it("accepts null", () => {
    const result = validateCreateCustomer({ companyName: "Acme", industry: null });

    expect(result).toEqual({
      ok: true,
      data: { companyName: "Acme", industry: null },
    });
  });

  // Protects the industry length limit (100 OK, 101 rejected).
  it("enforces the 100 character limit", () => {
    const atLimit = validateCreateCustomer({
      companyName: "Acme",
      industry: "i".repeat(100),
    });
    const overLimit = validateCreateCustomer({
      companyName: "Acme",
      industry: "i".repeat(101),
    });

    expect(atLimit.ok).toBe(true);
    expect(overLimit).toEqual({
      ok: false,
      errors: ["industry must be at most 100 characters"],
    });
  });

  // Protects that industry stays on one line, and against NUL (Postgres refuses it).
  it("rejects a tab or a NUL character", () => {
    for (const industry of ["Health\tcare", "Healthcare\u0000"]) {
      const result = validateCreateCustomer({ companyName: "Acme", industry });

      expect(result).toEqual({
        ok: false,
        errors: ["industry contains invalid characters"],
      });
    }
  });

  // Protects against numbers or other non-text values.
  it("rejects a number", () => {
    const result = validateCreateCustomer({ companyName: "Acme", industry: 42 });

    expect(result).toEqual({
      ok: false,
      errors: ["industry must be a string or null"],
    });
  });

  // Protects that industry alone is a valid update.
  it("is allowed as the only field in an update", () => {
    const result = validateUpdateCustomer({ industry: " IT Services " });

    expect(result).toEqual({ ok: true, data: { industry: "IT Services" } });
  });
});

describe("customer status field", () => {
  const STATUS_ERROR = "status must be one of: ACTIVE, INACTIVE";

  // Protects that both statuses can be chosen when creating a customer.
  it("accepts ACTIVE and INACTIVE on create", () => {
    for (const status of ["ACTIVE", "INACTIVE"]) {
      const result = validateCreateCustomer({ companyName: "Acme", status });

      expect(result).toEqual({ ok: true, data: { companyName: "Acme", status } });
    }
  });

  // Protects that a customer can be switched between statuses on update.
  it("accepts ACTIVE and INACTIVE on update", () => {
    for (const status of ["ACTIVE", "INACTIVE"]) {
      const result = validateUpdateCustomer({ status });

      expect(result).toEqual({ ok: true, data: { status } });
    }
  });

  // Protects that leaving status out on create lets the database default (ACTIVE) apply.
  it("leaves status out of the data when it is not sent", () => {
    const result = validateCreateCustomer({ companyName: "Acme" });

    expect(result.ok && "status" in result.data).toBe(false);
  });

  // Protects that status must match the database enum exactly: lowercase,
  // null (every customer needs a status) and numbers are rejected.
  for (const status of ["active", null, 1]) {
    it(`rejects status ${JSON.stringify(status)}`, () => {
      const created = validateCreateCustomer({ companyName: "Acme", status });
      const updated = validateUpdateCustomer({ status });

      expect(created).toEqual({ ok: false, errors: [STATUS_ERROR] });
      expect(updated).toEqual({ ok: false, errors: [STATUS_ERROR] });
    });
  }
});
