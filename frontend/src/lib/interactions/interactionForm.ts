// Everything the Log / Edit interaction form needs that is plain data and
// logic (no React, no server code), so it can be unit-tested and shared by
// the form (browser) and the Server Actions (server).
//
// - the form's fields, and friendly labels for the backend's field names
// - reading the submitted FormData safely (only known fields, trimmed)
// - turning the Date + Time inputs (India time) into the backend's ISO text
//   with "+05:30", and back again for the Edit form
// - building the JSON body for POST /interactions and PATCH /interactions/:id
// - the shape of the form's state (typed values + errors)
import type { Interaction, InteractionType } from "@/lib/api/types";
import { isPlainDate, kolkataDateAndTime } from "@/lib/format/dates";
import { readCustomerId } from "@/lib/customers/customerPageView";

/** Every input of the form, by its `name`, in the order they are shown. */
export const INTERACTION_FORM_FIELDS = ["customerId", "type", "summary", "date", "time"] as const;

export type InteractionFormField = (typeof INTERACTION_FORM_FIELDS)[number];

/** What the user typed (or chose) in each input. Always text, never null. */
export type InteractionFormValues = Record<InteractionFormField, string>;

/**
 * The backend's field names (used at the start of its error messages), in
 * form order, with friendly labels. occurredAt is the Date + Time pair.
 */
export const INTERACTION_FIELD_LABELS = {
  customerId: "Customer",
  type: "Type",
  summary: "Summary",
  occurredAt: "Date and time",
} as const;

/** A field an error message can belong to. */
export type InteractionErrorField = keyof typeof INTERACTION_FIELD_LABELS;

/** Error fields in the order they are shown (for the error summary). */
export const INTERACTION_ERROR_FIELDS = Object.keys(
  INTERACTION_FIELD_LABELS,
) as InteractionErrorField[];

/** Longest summary allowed. MUST match MAX_SUMMARY_LENGTH in the backend. */
export const INTERACTION_SUMMARY_MAX_LENGTH = 5000;

/** The four types, in the order the form shows them. */
export const INTERACTION_TYPES: readonly InteractionType[] = ["CALL", "EMAIL", "MEETING", "NOTE"];

/** India's fixed offset from UTC (no daylight saving). */
const KOLKATA_OFFSET = "+05:30";

// "HH:mm" in 24-hour time, as <input type="time"> sends it, e.g. "16:00".
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The values of a brand-new, empty form. */
export const EMPTY_INTERACTION_FORM_VALUES: InteractionFormValues = {
  customerId: "",
  type: "",
  summary: "",
  date: "",
  time: "",
};

/** The form's state, kept by useActionState between submits. */
export type InteractionFormState = {
  /** What is in the form, so a failed save keeps the user's typing. */
  values: InteractionFormValues;
  /** One message per field that has a problem. */
  fieldErrors: Partial<Record<InteractionErrorField, string>>;
  /** Messages that belong to no single field (shown at the top). */
  formErrors: string[];
};

/** The state a form starts with: the given values and no errors. */
export function initialInteractionFormState(values: InteractionFormValues): InteractionFormState {
  return { values, fieldErrors: {}, formErrors: [] };
}

/** "CALL" -> "CALL"; anything that is not one of the four types -> null. */
export function readInteractionType(value: string | undefined): InteractionType | null {
  return INTERACTION_TYPES.find((type) => type === value) ?? null;
}

/** Fill the Edit form from a saved interaction (date and time in India). */
export function interactionToFormValues(interaction: Interaction): InteractionFormValues {
  const { date, time } = kolkataDateAndTime(interaction.occurredAt);
  return {
    customerId: String(interaction.customerId),
    type: interaction.type,
    summary: interaction.summary,
    date,
    time,
  };
}

/**
 * Read ONLY the known fields from a submitted form, trimmed.
 * Extra fields someone adds by hand are ignored; a missing field or a file
 * upload in its place becomes "".
 */
export function readInteractionFormValues(formData: FormData): InteractionFormValues {
  const values = { ...EMPTY_INTERACTION_FORM_VALUES };
  for (const field of INTERACTION_FORM_FIELDS) {
    const raw = formData.get(field);
    values[field] = typeof raw === "string" ? raw.trim() : "";
  }
  return values;
}

/**
 * The result of reading the Date + Time inputs:
 * - ok with occurredAt: the ISO text for the backend
 * - ok with occurredAt undefined: both inputs were empty
 * - not ok: a friendly message to show next to the inputs
 */
export type OccurredAtResult =
  | { ok: true; occurredAt: string | undefined }
  | { ok: false; error: string };

/**
 * Turn the form's India date and time into the backend's ISO text.
 * Example: ("2026-10-26", "16:00") -> "2026-10-26T16:00:00+05:30"
 * Both empty -> no value (the caller decides: "now" on create, "unchanged" on edit).
 * Only one filled, or a value that is not a real date / time -> an error.
 */
export function kolkataInputsToIso(date: string, time: string): OccurredAtResult {
  if (date === "" && time === "") {
    return { ok: true, occurredAt: undefined };
  }
  if (date === "" || time === "") {
    return { ok: false, error: "Fill in both the date and the time, or leave both empty" };
  }
  if (!isPlainDate(date)) {
    return { ok: false, error: "Enter a real date, like 2026-10-26" };
  }
  if (!TIME_PATTERN.test(time)) {
    return { ok: false, error: "Enter a time like 16:00" };
  }
  return { ok: true, occurredAt: `${date}T${time}:00${KOLKATA_OFFSET}` };
}

/** JSON body for POST /interactions. Left-out fields get the backend's "is required". */
export type CreateInteractionBody = {
  customerId?: number;
  type?: string;
  summary: string;
  occurredAt?: string;
};

/** JSON body for PATCH /interactions/:id. Never a customerId: it cannot change. */
export type UpdateInteractionBody = {
  type?: string;
  summary: string;
  occurredAt?: string;
};

/**
 * Body for logging an interaction.
 * - customerId: sent only when it is a valid id (else "Customer is required")
 * - type: sent only when chosen; the backend checks it is one of the four
 * - occurredAt: from kolkataInputsToIso; leave out for "now"
 */
export function createInteractionBody(
  values: InteractionFormValues,
  occurredAt: string | undefined,
): CreateInteractionBody {
  return {
    customerId: readCustomerId(values.customerId) ?? undefined,
    type: values.type === "" ? undefined : values.type,
    summary: values.summary,
    occurredAt,
  };
}

/** Body for editing an interaction: type, summary, and occurredAt if given. */
export function updateInteractionBody(
  values: InteractionFormValues,
  occurredAt: string | undefined,
): UpdateInteractionBody {
  return {
    type: values.type === "" ? undefined : values.type,
    summary: values.summary,
    occurredAt,
  };
}
