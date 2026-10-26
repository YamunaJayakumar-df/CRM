// Checks the JSON body of "create follow-up" and "update follow-up" requests.
//
// Why: the backend must never trust what a browser sends. This file decides
// which fields are allowed, trims text, enforces limits, and collects EVERY
// problem at once so the user can fix them all in one go.
// It only checks data; it never touches the database or the HTTP response
// (so "does this customer exist?" is checked in followUpRoutes.ts).
import { isValidId } from "../shared/parseId.js";
import { isPlainDate, plainDateToDate } from "../shared/plainDate.js";
import {
  hasControlCharacters,
  hasControlCharactersInMultilineText,
} from "../shared/textChecks.js";

// Fields a client may send when creating. Anything else (id, createdAt, ...) is rejected.
const ALLOWED_CREATE_FIELDS = [
  "customerId",
  "title",
  "dueDate",
  "status",
  "priority",
  "notes",
] as const;

// Fields a client may send when updating. customerId is left out on purpose:
// moving a follow-up to another customer is not supported.
const ALLOWED_UPDATE_FIELDS = [
  "title",
  "dueDate",
  "status",
  "priority",
  "notes",
] as const;

// The possible states of a follow-up. Must match the FollowUpStatus enum in schema.prisma.
// Exported so the ?status= list filter in followUpRoutes.ts uses the same list.
export const FOLLOW_UP_STATUSES = ["OPEN", "DONE"] as const;

export type FollowUpStatusName = (typeof FOLLOW_UP_STATUSES)[number];

// How urgent a follow-up is. Must match the FollowUpPriority enum in schema.prisma.
export const FOLLOW_UP_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type FollowUpPriorityName = (typeof FOLLOW_UP_PRIORITIES)[number];

// Maximum lengths (in characters, after trimming).
const MAX_TITLE_LENGTH = 200;
const MAX_NOTES_LENGTH = 5000;

/**
 * Clean data for creating a follow-up. status, priority and notes are left out
 * when not sent (the database then uses OPEN and MEDIUM).
 */
export type CreateFollowUpData = {
  customerId: number;
  title: string;
  dueDate: Date;
  status?: FollowUpStatusName;
  priority?: FollowUpPriorityName;
  notes?: string | null;
};

/** Clean data for updating a follow-up. Only the fields that were sent are present. */
export type UpdateFollowUpData = {
  title?: string;
  dueDate?: Date;
  status?: FollowUpStatusName;
  priority?: FollowUpPriorityName;
  notes?: string | null;
};

/** Either clean data, or the list of everything that is wrong. */
export type ValidationResult<Data> =
  | { ok: true; data: Data }
  | { ok: false; errors: string[] };

/** Validate the body of POST /follow-ups. customerId, title and dueDate are required. */
export function validateCreateFollowUp(
  body: unknown,
): ValidationResult<CreateFollowUpData> {
  if (!isPlainObject(body)) {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }

  const errors = findUnknownFields(body, ALLOWED_CREATE_FIELDS);
  const fields = readFollowUpFields(body, errors);

  let customerId: number | undefined;
  if (Object.hasOwn(body, "customerId")) {
    customerId = readCustomerId(body.customerId, errors);
  } else {
    errors.push("customerId is required");
  }
  if (!Object.hasOwn(body, "title")) {
    errors.push("title is required");
  }
  if (!Object.hasOwn(body, "dueDate")) {
    errors.push("dueDate is required");
  }

  if (
    errors.length > 0 ||
    customerId === undefined ||
    fields.title === undefined ||
    fields.dueDate === undefined
  ) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    data: {
      ...fields,
      customerId,
      title: fields.title,
      dueDate: fields.dueDate,
    },
  };
}

/** Validate the body of PATCH /follow-ups/:id. At least one field is required. */
export function validateUpdateFollowUp(
  body: unknown,
): ValidationResult<UpdateFollowUpData> {
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

  const fields = readFollowUpFields(body, errors);

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
 * Read and clean title, dueDate, status, priority and notes if they are present in the body.
 * Problems are added to `errors`; fields with problems are left out of the result.
 */
function readFollowUpFields(
  body: Record<string, unknown>,
  errors: string[],
): UpdateFollowUpData {
  const fields: UpdateFollowUpData = {};

  if (Object.hasOwn(body, "title")) {
    const title = readTitle(body.title, errors);
    if (title !== undefined) {
      fields.title = title;
    }
  }

  if (Object.hasOwn(body, "dueDate")) {
    const dueDate = readDueDate(body.dueDate, errors);
    if (dueDate !== undefined) {
      fields.dueDate = dueDate;
    }
  }

  if (Object.hasOwn(body, "status")) {
    const status = readStatus(body.status, errors);
    if (status !== undefined) {
      fields.status = status;
    }
  }

  if (Object.hasOwn(body, "priority")) {
    const priority = readPriority(body.priority, errors);
    if (priority !== undefined) {
      fields.priority = priority;
    }
  }

  if (Object.hasOwn(body, "notes")) {
    const notes = readNotes(body.notes, errors);
    if (notes !== undefined) {
      fields.notes = notes;
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

/** title must be non-empty, single-line text. Returns the trimmed value, or undefined on error. */
function readTitle(raw: unknown, errors: string[]): string | undefined {
  if (typeof raw !== "string") {
    errors.push("title must be a string");
    return undefined;
  }

  const title = raw.trim();
  if (title === "") {
    errors.push("title cannot be empty");
    return undefined;
  }
  // Single-line: line breaks and tabs are not allowed in a title.
  if (hasControlCharacters(title)) {
    errors.push("title contains invalid characters");
    return undefined;
  }
  if (title.length > MAX_TITLE_LENGTH) {
    errors.push(`title must be at most ${MAX_TITLE_LENGTH} characters`);
    return undefined;
  }
  return title;
}

/**
 * dueDate must be a plain date string like "2026-10-30" (no time, no timezone).
 * Returns it as a Date at midnight UTC (what Prisma expects), or undefined on error.
 */
function readDueDate(raw: unknown, errors: string[]): Date | undefined {
  if (!isPlainDate(raw)) {
    errors.push('dueDate must be a date like "2026-10-30"');
    return undefined;
  }
  return plainDateToDate(raw);
}

/** status must be exactly one of FOLLOW_UP_STATUSES (uppercase). Returns undefined on error. */
function readStatus(
  raw: unknown,
  errors: string[],
): FollowUpStatusName | undefined {
  const allowed: readonly unknown[] = FOLLOW_UP_STATUSES;
  if (!allowed.includes(raw)) {
    errors.push(`status must be one of: ${FOLLOW_UP_STATUSES.join(", ")}`);
    return undefined;
  }
  return raw as FollowUpStatusName;
}

/**
 * priority must be exactly one of FOLLOW_UP_PRIORITIES (uppercase). null is
 * rejected because every follow-up has a priority. Returns undefined on error.
 */
function readPriority(
  raw: unknown,
  errors: string[],
): FollowUpPriorityName | undefined {
  const allowed: readonly unknown[] = FOLLOW_UP_PRIORITIES;
  if (!allowed.includes(raw)) {
    errors.push(`priority must be one of: ${FOLLOW_UP_PRIORITIES.join(", ")}`);
    return undefined;
  }
  return raw as FollowUpPriorityName;
}

/**
 * notes is optional multi-line text. null or empty text means "no notes" and gives null.
 * Returns the trimmed text, null, or undefined on error.
 */
function readNotes(raw: unknown, errors: string[]): string | null | undefined {
  if (raw === null) {
    return null;
  }
  if (typeof raw !== "string") {
    errors.push("notes must be a string or null");
    return undefined;
  }

  const notes = raw.trim();
  if (notes === "") {
    return null;
  }
  if (hasControlCharactersInMultilineText(notes)) {
    errors.push("notes contains invalid characters");
    return undefined;
  }
  if (notes.length > MAX_NOTES_LENGTH) {
    errors.push(`notes must be at most ${MAX_NOTES_LENGTH} characters`);
    return undefined;
  }
  return notes;
}
