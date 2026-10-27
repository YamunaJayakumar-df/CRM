// Everything the New / Edit follow-up form needs that is plain data and
// logic (no React, no server code), so it can be unit-tested and shared by
// the form (browser) and the Server Actions (server).
//
// - the form's fields, and friendly labels for the backend's field names
// - reading the submitted FormData safely (only known fields, trimmed)
// - a friendly check of the Due date before it is sent
// - building the JSON body for POST /follow-ups and PATCH /follow-ups/:id
// - the shape of the form's state (typed values + errors)
import type { FollowUp, FollowUpPriority, FollowUpStatus } from "@/lib/api/types";
import { readCustomerId } from "@/lib/dashboard/customerPanelView";
import { isPlainDate } from "@/lib/format/dates";

/** Every input of the form, by its `name`, in the order they are shown. */
export const FOLLOW_UP_FORM_FIELDS = [
  "customerId",
  "title",
  "dueDate",
  "priority",
  "status",
  "notes",
] as const;

export type FollowUpFormField = (typeof FOLLOW_UP_FORM_FIELDS)[number];

/** What the user typed (or chose) in each input. Always text, never null. */
export type FollowUpFormValues = Record<FollowUpFormField, string>;

/**
 * Friendly labels for the backend's field names (used at the start of its
 * error messages), in form order. Here every input has the backend's name.
 */
export const FOLLOW_UP_FIELD_LABELS: Record<FollowUpFormField, string> = {
  customerId: "Customer",
  title: "Title",
  dueDate: "Due date",
  priority: "Priority",
  status: "Status",
  notes: "Notes",
};

/** Error fields in the order they are shown (for the error summary). */
export const FOLLOW_UP_ERROR_FIELDS: readonly FollowUpFormField[] = FOLLOW_UP_FORM_FIELDS;

/** Longest texts allowed. MUST match MAX_TITLE_LENGTH / MAX_NOTES_LENGTH in the backend. */
export const FOLLOW_UP_TITLE_MAX_LENGTH = 200;
export const FOLLOW_UP_NOTES_MAX_LENGTH = 5000;

/** The three priorities, in the order the form shows them. */
export const FOLLOW_UP_PRIORITIES: readonly FollowUpPriority[] = ["LOW", "MEDIUM", "HIGH"];

/** The two statuses, in the order the form shows them. */
export const FOLLOW_UP_STATUSES: readonly FollowUpStatus[] = ["OPEN", "DONE"];

/** The years the backend accepts for a due date. */
const MIN_DUE_YEAR = 2000;
const MAX_DUE_YEAR = 2100;

/** The values of a brand-new form. New follow-ups start Open, Medium priority. */
export const EMPTY_FOLLOW_UP_FORM_VALUES: FollowUpFormValues = {
  customerId: "",
  title: "",
  dueDate: "",
  priority: "MEDIUM",
  status: "OPEN",
  notes: "",
};

/** The form's state, kept by useActionState between submits. */
export type FollowUpFormState = {
  /** What is in the form, so a failed save keeps the user's typing. */
  values: FollowUpFormValues;
  /** One message per field that has a problem. */
  fieldErrors: Partial<Record<FollowUpFormField, string>>;
  /** Messages that belong to no single field (shown at the top). */
  formErrors: string[];
};

/** The state a form starts with: the given values and no errors. */
export function initialFollowUpFormState(values: FollowUpFormValues): FollowUpFormState {
  return { values, fieldErrors: {}, formErrors: [] };
}

/** "OPEN" -> "OPEN"; anything that is not OPEN or DONE -> null. */
export function readFollowUpStatus(value: unknown): FollowUpStatus | null {
  return FOLLOW_UP_STATUSES.find((status) => status === value) ?? null;
}

/** Fill the Edit form from a saved follow-up; no notes (null) becomes "". */
export function followUpToFormValues(followUp: FollowUp): FollowUpFormValues {
  return {
    customerId: String(followUp.customerId),
    title: followUp.title,
    dueDate: followUp.dueDate,
    priority: followUp.priority,
    status: followUp.status,
    notes: followUp.notes ?? "",
  };
}

/**
 * Read ONLY the known fields from a submitted form, trimmed.
 * Extra fields someone adds by hand are ignored; a missing field or a file
 * upload in its place becomes "".
 */
export function readFollowUpFormValues(formData: FormData): FollowUpFormValues {
  const values = { ...EMPTY_FOLLOW_UP_FORM_VALUES };
  for (const field of FOLLOW_UP_FORM_FIELDS) {
    const raw = formData.get(field);
    values[field] = typeof raw === "string" ? raw.trim() : "";
  }
  return values;
}

/**
 * A friendly message when the Due date cannot be right, else null.
 * <input type="date"> sends "YYYY-MM-DD" (or "" when empty). The backend
 * checks it again; this only gives clearer words than its message.
 * Example: "" -> "Due date is required"; "2026-10-30" -> null
 */
export function dueDateError(dueDate: string): string | null {
  if (dueDate === "") {
    return "Due date is required";
  }
  if (!isPlainDate(dueDate)) {
    return "Enter a real date, like 2026-10-30";
  }
  const year = Number(dueDate.slice(0, 4));
  if (year < MIN_DUE_YEAR || year > MAX_DUE_YEAR) {
    return `Choose a date between ${MIN_DUE_YEAR} and ${MAX_DUE_YEAR}`;
  }
  return null;
}

/**
 * Problems we can spot before asking the backend, collected TOGETHER so the
 * user sees all of them at once (e.g. a bad date AND an empty title).
 * `isCreate` adds the "Customer is required" check (the customer can't change on edit).
 * Returns an empty object when nothing is wrong. The backend checks everything again.
 */
export function localFollowUpErrors(
  values: FollowUpFormValues,
  isCreate: boolean,
): Partial<Record<FollowUpFormField, string>> {
  const errors: Partial<Record<FollowUpFormField, string>> = {};
  if (isCreate && values.customerId === "") {
    errors.customerId = "Customer is required";
  }
  if (values.title === "") {
    errors.title = "Title is required";
  }
  const dateError = dueDateError(values.dueDate);
  if (dateError !== null) {
    errors.dueDate = dateError;
  }
  return errors;
}

/** JSON body for POST /follow-ups. Left-out fields get the backend's "is required" / default. */
export type CreateFollowUpBody = {
  customerId?: number;
  title: string;
  dueDate: string;
  priority?: string;
  notes: string;
};

/** JSON body for PATCH /follow-ups/:id. Never a customerId: it cannot change. */
export type UpdateFollowUpBody = {
  title: string;
  dueDate: string;
  priority?: string;
  status?: string;
  notes: string;
};

/**
 * Body for creating a follow-up.
 * - customerId: sent only when it is a valid id (else "Customer is required")
 * - priority: sent only when chosen (the backend's default is MEDIUM)
 * - no status: new follow-ups are always Open
 * - notes: sent even when empty ("" is stored as "no notes")
 */
export function createFollowUpBody(values: FollowUpFormValues): CreateFollowUpBody {
  return {
    customerId: readCustomerId(values.customerId) ?? undefined,
    title: values.title,
    dueDate: values.dueDate,
    priority: values.priority === "" ? undefined : values.priority,
    notes: values.notes,
  };
}

/**
 * Body for editing a follow-up. Title, due date and notes are always sent,
 * so emptied notes are cleared. Priority and status are passed on as chosen;
 * the backend rejects anything but its known values.
 */
export function updateFollowUpBody(values: FollowUpFormValues): UpdateFollowUpBody {
  return {
    title: values.title,
    dueDate: values.dueDate,
    priority: values.priority === "" ? undefined : values.priority,
    status: values.status === "" ? undefined : values.status,
    notes: values.notes,
  };
}
