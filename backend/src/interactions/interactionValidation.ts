// Checks the JSON body of "create interaction" and "update interaction" requests.
//
// Why: the backend must never trust what a browser sends. This file decides
// which fields are allowed, trims text, enforces limits, and collects EVERY
// problem at once so the user can fix them all in one go.
// It only checks data; it never touches the database or the HTTP response
// (so "does this customer exist?" is checked in interactionRoutes.ts).
import { startsWithRealCalendarDate } from "../shared/dateChecks.js";
import { isValidId } from "../shared/parseId.js";
import { hasControlCharactersInMultilineText } from "../shared/textChecks.js";

// Fields a client may send when creating. Anything else (id, createdAt, ...) is rejected.
const ALLOWED_CREATE_FIELDS = [
  "customerId",
  "type",
  "summary",
  "occurredAt",
] as const;

// Fields a client may send when updating. customerId is left out on purpose:
// moving an interaction to another customer is not supported.
const ALLOWED_UPDATE_FIELDS = ["type", "summary", "occurredAt"] as const;

// The kinds of interaction. Must match the InteractionType enum in schema.prisma.
const INTERACTION_TYPES = ["CALL", "EMAIL", "MEETING", "NOTE"] as const;

type InteractionTypeName = (typeof INTERACTION_TYPES)[number];

// Maximum length of the summary (in characters, after trimming).
const MAX_SUMMARY_LENGTH = 5000;

// "2026-10-26T10:30" plus optional seconds/fraction, and a REQUIRED timezone:
// "Z" (UTC) or an offset like "+05:30". Without a timezone the server would
// guess using its own local time, so the same text could mean different moments.
const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

/** Clean data for creating an interaction. occurredAt is left out when not sent. */
export type CreateInteractionData = {
  customerId: number;
  type: InteractionTypeName;
  summary: string;
  occurredAt?: Date;
};

/** Clean data for updating an interaction. Only the fields that were sent are present. */
export type UpdateInteractionData = {
  type?: InteractionTypeName;
  summary?: string;
  occurredAt?: Date;
};

/** Either clean data, or the list of everything that is wrong. */
export type ValidationResult<Data> =
  | { ok: true; data: Data }
  | { ok: false; errors: string[] };

/** Validate the body of POST /interactions. customerId, type and summary are required. */
export function validateCreateInteraction(
  body: unknown,
): ValidationResult<CreateInteractionData> {
  if (!isPlainObject(body)) {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }

  const errors = findUnknownFields(body, ALLOWED_CREATE_FIELDS);
  const fields = readInteractionFields(body, errors);

  let customerId: number | undefined;
  if (Object.hasOwn(body, "customerId")) {
    customerId = readCustomerId(body.customerId, errors);
  } else {
    errors.push("customerId is required");
  }
  if (!Object.hasOwn(body, "type")) {
    errors.push("type is required");
  }
  if (!Object.hasOwn(body, "summary")) {
    errors.push("summary is required");
  }

  if (
    errors.length > 0 ||
    customerId === undefined ||
    fields.type === undefined ||
    fields.summary === undefined
  ) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    data: { ...fields, customerId, type: fields.type, summary: fields.summary },
  };
}

/** Validate the body of PATCH /interactions/:id. At least one field is required. */
export function validateUpdateInteraction(
  body: unknown,
): ValidationResult<UpdateInteractionData> {
  if (!isPlainObject(body)) {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }

  // customerId gets its own clearer message below instead of "Unknown field".
  const errors = findUnknownFields(body, [
    ...ALLOWED_UPDATE_FIELDS,
    "customerId",
  ]);
  if (Object.hasOwn(body, "customerId")) {
    errors.push("customerId cannot be changed");
  }

  const fields = readInteractionFields(body, errors);

  const hasAllowedField = ALLOWED_UPDATE_FIELDS.some((field) =>
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

/** One "Unknown field: X" error for every key that is not in `allowed`. */
function findUnknownFields(
  body: Record<string, unknown>,
  allowed: readonly string[],
): string[] {
  return Object.keys(body)
    .filter((key) => !allowed.includes(key))
    .map((key) => `Unknown field: ${key}`);
}

/**
 * Read and clean type, summary and occurredAt if they are present in the body.
 * Problems are added to `errors`; fields with problems are left out of the result.
 */
function readInteractionFields(
  body: Record<string, unknown>,
  errors: string[],
): UpdateInteractionData {
  const fields: UpdateInteractionData = {};

  if (Object.hasOwn(body, "type")) {
    const type = readType(body.type, errors);
    if (type !== undefined) {
      fields.type = type;
    }
  }

  if (Object.hasOwn(body, "summary")) {
    const summary = readSummary(body.summary, errors);
    if (summary !== undefined) {
      fields.summary = summary;
    }
  }

  if (Object.hasOwn(body, "occurredAt")) {
    const occurredAt = readOccurredAt(body.occurredAt, errors);
    if (occurredAt !== undefined) {
      fields.occurredAt = occurredAt;
    }
  }

  return fields;
}

/** customerId must be a JSON number that could be a real id. Returns undefined on error. */
function readCustomerId(raw: unknown, errors: string[]): number | undefined {
  if (!isValidId(raw)) {
    errors.push("customerId must be a positive whole number");
    return undefined;
  }
  return raw;
}

/** type must be exactly one of INTERACTION_TYPES (uppercase). Returns undefined on error. */
function readType(
  raw: unknown,
  errors: string[],
): InteractionTypeName | undefined {
  const allowed: readonly unknown[] = INTERACTION_TYPES;
  if (!allowed.includes(raw)) {
    errors.push(`type must be one of: ${INTERACTION_TYPES.join(", ")}`);
    return undefined;
  }
  return raw as InteractionTypeName;
}

/** summary must be non-empty text; line breaks are allowed. Returns the trimmed value, or undefined on error. */
function readSummary(raw: unknown, errors: string[]): string | undefined {
  if (typeof raw !== "string") {
    errors.push("summary must be a string");
    return undefined;
  }

  const summary = raw.trim();
  if (summary === "") {
    errors.push("summary cannot be empty");
    return undefined;
  }
  if (hasControlCharactersInMultilineText(summary)) {
    errors.push("summary contains invalid characters");
    return undefined;
  }
  if (summary.length > MAX_SUMMARY_LENGTH) {
    errors.push(`summary must be at most ${MAX_SUMMARY_LENGTH} characters`);
    return undefined;
  }
  return summary;
}

/**
 * occurredAt must be a date-time string with a timezone, e.g.
 * "2026-10-26T10:30:00Z" or "2026-10-26T16:00:00+05:30".
 * Returns it as a Date, or undefined on error.
 */
function readOccurredAt(raw: unknown, errors: string[]): Date | undefined {
  const message =
    'occurredAt must be a date-time with a timezone, like "2026-10-26T10:30:00Z"';

  if (typeof raw !== "string" || !DATE_TIME_PATTERN.test(raw)) {
    errors.push(message);
    return undefined;
  }

  // The pattern only checks the shape. Date.parse catches impossible values like
  // month 13 or hour 25; startsWithRealCalendarDate catches days like 31 February.
  const milliseconds = Date.parse(raw);
  if (Number.isNaN(milliseconds) || !startsWithRealCalendarDate(raw)) {
    errors.push(message);
    return undefined;
  }
  return new Date(milliseconds);
}
