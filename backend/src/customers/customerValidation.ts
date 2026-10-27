// Checks the JSON body of "create customer" and "update customer" requests.
//
// Why: the backend must never trust what a browser sends. This file decides
// which fields are allowed, trims text, enforces length limits, and collects
// EVERY problem at once so the user can fix them all in one go.
// It only checks data; it never touches the database or the HTTP response.
import {
  hasControlCharacters,
  hasControlCharactersInMultilineText,
  normalizeLineBreaks,
} from "../shared/textChecks.js";

// The only fields a client may send. Anything else (id, createdAt, ...) is rejected.
const ALLOWED_FIELDS = [
  "companyName",
  "contactName",
  "website",
  "industry",
  "status",
  "email",
  "phone",
  "notes",
] as const;

// Whether we currently work with a customer. Must match the CustomerStatus
// enum in schema.prisma. Exported so other code can reuse the same list.
export const CUSTOMER_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type CustomerStatusName = (typeof CUSTOMER_STATUSES)[number];

// The fields that hold free text (every allowed field except status).
type CustomerTextField = Exclude<(typeof ALLOWED_FIELDS)[number], "status">;

// Maximum length (in characters, after trimming) for each text field.
const MAX_LENGTHS: Record<CustomerTextField, number> = {
  companyName: 200,
  contactName: 200,
  website: 200,
  industry: 100,
  email: 254, // the longest email address the standards allow
  phone: 50,
  notes: 5000,
};

// Deliberately simple: "something@something.something" with no spaces.
// Real delivery checks are out of scope for an internal CRM.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A website may be "acme.com" or start with http:// or https://, but must not
// name any other scheme like "javascript:" or "data:". Those could run code
// if the frontend ever showed the website as a clickable link.
const ANY_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const WEB_SCHEME_PATTERN = /^https?:\/\//i;

/** Clean data for creating a customer. Missing optional fields are left out. */
export type CreateCustomerData = {
  companyName: string;
  contactName?: string | null;
  // No strict URL format check on purpose: people type "acme.com",
  // "www.acme.com" or "https://acme.com", and all are fine. It is checked
  // like other single-line text, and other schemes ("javascript:") are rejected.
  website?: string | null;
  // Free text such as "Healthcare"; no fixed list yet.
  industry?: string | null;
  // Not sent -> the database default (ACTIVE) is used.
  status?: CustomerStatusName;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

/** Clean data for updating a customer. Only the fields that were sent are present. */
export type UpdateCustomerData = Partial<CreateCustomerData>;

/** Either clean data, or the list of everything that is wrong. */
export type ValidationResult<Data> =
  | { ok: true; data: Data }
  | { ok: false; errors: string[] };

/** Validate the body of POST /customers. companyName is required. */
export function validateCreateCustomer(
  body: unknown,
): ValidationResult<CreateCustomerData> {
  if (!isPlainObject(body)) {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }

  const errors = findUnknownFields(body);
  const fields = readCustomerFields(body, errors);

  if (!Object.hasOwn(body, "companyName")) {
    errors.push("companyName is required");
  }

  if (errors.length > 0 || fields.companyName === undefined) {
    return { ok: false, errors };
  }
  return { ok: true, data: { ...fields, companyName: fields.companyName } };
}

/** Validate the body of PATCH /customers/:id. At least one field is required. */
export function validateUpdateCustomer(
  body: unknown,
): ValidationResult<UpdateCustomerData> {
  if (!isPlainObject(body)) {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }

  const errors = findUnknownFields(body);
  const fields = readCustomerFields(body, errors);

  const hasAllowedField = ALLOWED_FIELDS.some((field) =>
    Object.hasOwn(body, field),
  );
  if (!hasAllowedField) {
    errors.push("Provide at least one field to update");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data: fields };
}

/** True for `{ ... }` objects; false for arrays, null, strings, numbers, etc. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** One "Unknown field: X" error for every key that is not in ALLOWED_FIELDS. */
function findUnknownFields(body: Record<string, unknown>): string[] {
  const allowed: readonly string[] = ALLOWED_FIELDS;
  return Object.keys(body)
    .filter((key) => !allowed.includes(key))
    .map((key) => `Unknown field: ${key}`);
}

/**
 * Read and clean every allowed field that is present in the body.
 * Problems are added to `errors`; fields with problems are left out of the result.
 */
function readCustomerFields(
  body: Record<string, unknown>,
  errors: string[],
): UpdateCustomerData {
  const fields: UpdateCustomerData = {};

  if (Object.hasOwn(body, "companyName")) {
    const companyName = readCompanyName(body.companyName, errors);
    if (companyName !== undefined) {
      fields.companyName = companyName;
    }
  }

  const optionalFields = [
    "contactName",
    "website",
    "industry",
    "email",
    "phone",
    "notes",
  ] as const;
  for (const field of optionalFields) {
    if (!Object.hasOwn(body, field)) {
      continue;
    }
    const value = readOptionalText(field, body[field], errors);
    if (value !== undefined) {
      fields[field] = value;
    }
  }

  if (Object.hasOwn(body, "status")) {
    const status = readStatus(body.status, errors);
    if (status !== undefined) {
      fields.status = status;
    }
  }

  return fields;
}

/**
 * status must be exactly one of CUSTOMER_STATUSES (uppercase). null is rejected
 * because every customer must have a status. Returns undefined on error.
 */
function readStatus(
  raw: unknown,
  errors: string[],
): CustomerStatusName | undefined {
  const allowed: readonly unknown[] = CUSTOMER_STATUSES;
  if (!allowed.includes(raw)) {
    errors.push(`status must be one of: ${CUSTOMER_STATUSES.join(", ")}`);
    return undefined;
  }
  return raw as CustomerStatusName;
}

/** companyName must be a non-empty string. Returns the trimmed value, or undefined on error. */
function readCompanyName(raw: unknown, errors: string[]): string | undefined {
  if (typeof raw !== "string") {
    errors.push("companyName must be a string");
    return undefined;
  }

  const companyName = raw.trim();
  if (companyName === "") {
    errors.push("companyName cannot be empty");
    return undefined;
  }
  if (hasControlCharacters(companyName)) {
    errors.push("companyName contains invalid characters");
    return undefined;
  }
  if (companyName.length > MAX_LENGTHS.companyName) {
    errors.push(
      `companyName must be at most ${MAX_LENGTHS.companyName} characters`,
    );
    return undefined;
  }
  return companyName;
}

/**
 * Optional text fields accept a string or null. Strings are trimmed and an
 * empty string becomes null (meaning "no value"). Returns undefined on error.
 */
function readOptionalText(
  field: CustomerTextField,
  raw: unknown,
  errors: string[],
): string | null | undefined {
  if (raw === null) {
    return null;
  }
  if (typeof raw !== "string") {
    errors.push(`${field} must be a string or null`);
    return undefined;
  }

  // Notes may be multi-line: store browser "\r\n" line breaks as "\n".
  const text = field === "notes" ? normalizeLineBreaks(raw).trim() : raw.trim();
  if (text === "") {
    return null;
  }
  // Only notes may contain line breaks and tabs.
  const hasInvalidCharacters =
    field === "notes"
      ? hasControlCharactersInMultilineText(text)
      : hasControlCharacters(text);
  if (hasInvalidCharacters) {
    errors.push(`${field} contains invalid characters`);
    return undefined;
  }
  if (text.length > MAX_LENGTHS[field]) {
    errors.push(`${field} must be at most ${MAX_LENGTHS[field]} characters`);
    return undefined;
  }
  if (field === "email" && !EMAIL_PATTERN.test(text)) {
    errors.push("email must be a valid email address");
    return undefined;
  }
  if (field === "website" && hasNonWebScheme(text)) {
    errors.push("website must be a domain or an http(s):// address");
    return undefined;
  }
  return text;
}

/** True for "javascript:...", "data:..." etc.; false for "acme.com" and "https://acme.com". */
function hasNonWebScheme(website: string): boolean {
  return ANY_SCHEME_PATTERN.test(website) && !WEB_SCHEME_PATTERN.test(website);
}
