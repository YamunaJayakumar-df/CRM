// Checks the body of POST /ai/save: the review the user confirmed.
//
// Why check again (the review was already checked): anyone can send anything
// to this URL, not only our website. Like a bank clerk re-checking a slip.
// Values follow exactly the same rules as the CRM forms (we reuse their
// validators), and every problem is collected at once.
//
// What is NOT checked here (it needs the database): whether an existingId
// really exists. saveReview.ts checks that inside the save.
import { isValidId } from "../shared/parseId.js";
import { validateCreateCustomer, type CreateCustomerData } from "../customers/customerValidation.js";
import {
  validateUpdateFollowUp,
  type FollowUpPriorityName,
  type FollowUpStatusName,
} from "../followUps/followUpValidation.js";
import { validateUpdateInteraction, type InteractionTypeName } from "../interactions/interactionValidation.js";

/** Most customers one note can save at once. A real note has a few. */
export const MAX_CUSTOMERS_PER_SAVE = 10;

/** Most follow-ups one customer can get from one note. */
export const MAX_FOLLOW_UPS_PER_CUSTOMER = 10;

// The review id ("ticket number") is made by crypto.randomUUID() in Node,
// which always looks like "a3f9c2e1-5b7d-4c8e-9f1a-2b3c4d5e6f70".
const REVIEW_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Which customer the user confirmed: an existing one, or a new one. */
export type ConfirmedCustomer =
  | { kind: "existing"; id: number }
  | { kind: "new"; data: CreateCustomerData };

export type ConfirmedInteraction = {
  type: InteractionTypeName;
  summary: string;
  occurredAt?: Date;
};

export type ConfirmedFollowUp = {
  title: string;
  dueDate: Date;
  status?: FollowUpStatusName;
  priority?: FollowUpPriorityName;
  notes?: string | null;
};

/** One customer of the note, with ITS interaction and follow-ups. */
export type ConfirmedItem = {
  customer: ConfirmedCustomer;
  interaction: ConfirmedInteraction | null;
  followUps: ConfirmedFollowUp[];
};

export type ConfirmedSave = {
  reviewId: string;
  items: ConfirmedItem[];
};

export type ValidationResult<Data> =
  | { ok: true; data: Data }
  | { ok: false; errors: string[] };

/** True for `{ ... }` objects; false for arrays, null, strings, numbers, etc. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** One "Unknown field" error for every key that is not allowed. */
function unknownFields(body: Record<string, unknown>, allowed: string[], where: string): string[] {
  return Object.keys(body)
    .filter((key) => !allowed.includes(key))
    .map((key) => `${where}: unknown field ${key}`);
}

// The "update" validators say this when no field was sent. Here our own
// "... is required" messages say it better, so this one is left out.
const NO_FIELDS_MESSAGE = "Provide at least one field to update";

/** The update validator's errors, without the confusing "no fields" one. */
function validatorErrors(checked: { ok: true } | { ok: false; errors: string[] }): string[] {
  return checked.ok ? [] : checked.errors.filter((error) => error !== NO_FIELDS_MESSAGE);
}

/** The confirmed customer: exactly one of existingId or createNew. */
function readCustomer(raw: unknown, where: string, errors: string[]): ConfirmedCustomer | undefined {
  // Scenario: the user tries to save before choosing (e.g. two Greenfield schools).
  if (raw === undefined || raw === null) {
    errors.push(`${where}: choose a customer or create a new one`);
    return undefined;
  }
  if (!isPlainObject(raw)) {
    errors.push(`${where}: customer must be an object`);
    return undefined;
  }
  errors.push(...unknownFields(raw, ["existingId", "createNew"], where));

  const hasExisting = Object.hasOwn(raw, "existingId");
  const hasNew = Object.hasOwn(raw, "createNew");
  if (hasExisting === hasNew) {
    errors.push(`${where}: customer needs exactly one of existingId or createNew`);
    return undefined;
  }

  if (hasExisting) {
    if (!isValidId(raw.existingId)) {
      errors.push(`${where}: existingId must be a positive whole number`);
      return undefined;
    }
    return { kind: "existing", id: raw.existingId };
  }

  const created = validateCreateCustomer(raw.createNew);
  if (!created.ok) {
    errors.push(...created.errors.map((error) => `${where} (new customer): ${error}`));
    return undefined;
  }
  return { kind: "new", data: created.data };
}

/** The interaction, or null. type and summary are required. */
function readInteraction(raw: unknown, where: string, errors: string[]): ConfirmedInteraction | null | undefined {
  if (raw === undefined || raw === null) {
    return null;
  }
  // The "update" validator checks the values without needing a customer id yet;
  // the two required fields are checked here.
  const checked = validateUpdateInteraction(raw);
  const missing = ["type", "summary"].filter((field) => isPlainObject(raw) && !Object.hasOwn(raw, field));
  const problems = [...validatorErrors(checked), ...missing.map((field) => `${field} is required`)];
  if (problems.length > 0) {
    errors.push(...problems.map((problem) => `${where} (interaction): ${problem}`));
    return undefined;
  }
  if (!checked.ok || checked.data.type === undefined || checked.data.summary === undefined) {
    return undefined; // cannot happen after the checks above; keeps TypeScript sure
  }
  return { ...checked.data, type: checked.data.type, summary: checked.data.summary };
}

/** One follow-up. title and dueDate are required. */
function readFollowUp(raw: unknown, where: string, errors: string[]): ConfirmedFollowUp | undefined {
  const checked = validateUpdateFollowUp(raw);
  const missing = ["title", "dueDate"].filter((field) => isPlainObject(raw) && !Object.hasOwn(raw, field));
  const problems = [...validatorErrors(checked), ...missing.map((field) => `${field} is required`)];
  if (problems.length > 0) {
    errors.push(...problems.map((problem) => `${where}: ${problem}`));
    return undefined;
  }
  if (!checked.ok || checked.data.title === undefined || checked.data.dueDate === undefined) {
    return undefined; // cannot happen after the checks above; keeps TypeScript sure
  }
  return { ...checked.data, title: checked.data.title, dueDate: checked.data.dueDate };
}

/** The follow-ups list (may be missing or empty). */
function readFollowUps(raw: unknown, where: string, errors: string[]): ConfirmedFollowUp[] {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (!Array.isArray(raw)) {
    errors.push(`${where}: followUps must be a list`);
    return [];
  }
  if (raw.length > MAX_FOLLOW_UPS_PER_CUSTOMER) {
    errors.push(`${where}: at most ${MAX_FOLLOW_UPS_PER_CUSTOMER} follow-ups per customer`);
    return [];
  }
  const followUps: ConfirmedFollowUp[] = [];
  raw.forEach((item, index) => {
    const followUp = readFollowUp(item, `${where} (follow-up ${index + 1})`, errors);
    if (followUp !== undefined) {
      followUps.push(followUp);
    }
  });
  return followUps;
}

/** One customer of the note. */
function readItem(raw: unknown, number: number, errors: string[]): ConfirmedItem | undefined {
  const where = `Customer ${number}`;
  if (!isPlainObject(raw)) {
    errors.push(`${where}: must be an object`);
    return undefined;
  }
  errors.push(...unknownFields(raw, ["customer", "interaction", "followUps"], where));

  const errorsBefore = errors.length;
  const customer = readCustomer(raw.customer, where, errors);
  const interaction = readInteraction(raw.interaction, where, errors);
  const followUps = readFollowUps(raw.followUps, where, errors);
  if (customer === undefined || interaction === undefined || errors.length > errorsBefore) {
    return undefined;
  }

  // An existing customer with nothing to add would save nothing at all.
  if (customer.kind === "existing" && interaction === null && followUps.length === 0) {
    errors.push(`${where}: nothing to save (no interaction and no follow-ups)`);
    return undefined;
  }
  return { customer, interaction, followUps };
}

/** Validate the body of POST /ai/save. */
export function validateConfirmedSave(body: unknown): ValidationResult<ConfirmedSave> {
  if (!isPlainObject(body)) {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }
  const errors = unknownFields(body, ["reviewId", "customers"], "Request");

  const reviewId = body.reviewId;
  const reviewIdOk = typeof reviewId === "string" && REVIEW_ID_PATTERN.test(reviewId);
  if (!reviewIdOk) {
    errors.push("reviewId must be the id given by /ai/understand");
  }

  const items: ConfirmedItem[] = [];
  if (!Array.isArray(body.customers) || body.customers.length === 0) {
    errors.push("customers must be a list with at least one customer");
  } else if (body.customers.length > MAX_CUSTOMERS_PER_SAVE) {
    errors.push(`at most ${MAX_CUSTOMERS_PER_SAVE} customers can be saved at once`);
  } else {
    body.customers.forEach((raw, index) => {
      const item = readItem(raw, index + 1, errors);
      if (item !== undefined) {
        items.push(item);
      }
    });
  }

  // Anything wrong anywhere -> save NOTHING (never a part of the note).
  if (errors.length > 0 || !reviewIdOk) {
    return { ok: false, errors };
  }
  return { ok: true, data: { reviewId, items } };
}
