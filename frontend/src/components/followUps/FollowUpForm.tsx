// FollowUpForm: the New / Edit follow-up form (one component for both).
//
// Works exactly like InteractionForm (read its notes):
// - useActionState runs the Server Action (createFollowUp / updateFollowUp)
//   and gives back the typed values + errors when saving fails; on success
//   the action redirects away.
// - noValidate: every problem is shown the same way, next to its field.
// - ResetAfterSubmit: after a save, browser Back shows a fresh form.
//
// Fields:
// - Customer: a drop-down when creating; read-only text when editing (the
//   backend does not allow moving a follow-up to another customer).
// - Title (one line), Due date (a date picker), Priority (three pills).
// - Status (Open / Done pills): only when editing; new ones are always Open.
// - Notes: optional multi-line text.
"use client";

import { useActionState } from "react";
import LetterAvatar from "@/components/LetterAvatar";
import FormActions from "@/components/forms/FormActions";
import FormErrorSummary, { type FormErrorItem } from "@/components/forms/FormErrorSummary";
import PillRadioGroup, { pillRadioId } from "@/components/forms/PillRadioGroup";
import ResetAfterSubmit from "@/components/forms/ResetAfterSubmit";
import Select, { type SelectOption } from "@/components/forms/Select";
import TextArea from "@/components/forms/TextArea";
import TextField from "@/components/forms/TextField";
import {
  FOLLOW_UP_ERROR_FIELDS,
  FOLLOW_UP_FIELD_LABELS,
  FOLLOW_UP_NOTES_MAX_LENGTH,
  FOLLOW_UP_TITLE_MAX_LENGTH,
  initialFollowUpFormState,
  type FollowUpFormField,
  type FollowUpFormState,
  type FollowUpFormValues,
} from "@/lib/followUps/followUpForm";
import { PRIORITY_PILL_OPTIONS, STATUS_PILL_OPTIONS } from "./followUpPillOptions";

/** The few customer details the form needs. */
export type FollowUpFormCustomer = {
  id: number;
  companyName: string;
};

type FollowUpFormProps = {
  mode: "create" | "edit";
  /** The Server Action that saves the form. */
  action: (state: FollowUpFormState, formData: FormData) => Promise<FollowUpFormState>;
  initialValues: FollowUpFormValues;
  /** Create: every customer for the drop-down (A to Z). Edit: just the one. */
  customers: FollowUpFormCustomer[];
  /** Edit only: which follow-up is being changed. */
  followUpId?: number;
  /** A safe internal path to go to after saving. */
  returnTo?: string | null;
  /** Where Cancel goes. */
  cancelHref: string;
};

const ID_PREFIX = "follow-up";

/** Where each error's link in the summary jumps to. */
const ERROR_TARGET_IDS: Record<FollowUpFormField, string> = {
  customerId: `${ID_PREFIX}-customerId`,
  title: `${ID_PREFIX}-title`,
  dueDate: `${ID_PREFIX}-dueDate`,
  priority: pillRadioId(`${ID_PREFIX}-priority`, "LOW"),
  status: pillRadioId(`${ID_PREFIX}-status`, "OPEN"),
  notes: `${ID_PREFIX}-notes`,
};

/** Errors for the summary box: general ones first, then one per field (in form order). */
function summaryItems(state: FollowUpFormState): FormErrorItem[] {
  const items: FormErrorItem[] = state.formErrors.map((message) => ({ message }));
  for (const field of FOLLOW_UP_ERROR_FIELDS) {
    const message = state.fieldErrors[field];
    if (message !== undefined) {
      items.push({ message, href: `#${ERROR_TARGET_IDS[field]}` });
    }
  }
  return items;
}

/** Drop-down options: a "choose" prompt first, then every customer. */
function customerOptions(customers: FollowUpFormCustomer[]): SelectOption[] {
  return [
    { value: "", label: "Choose a customer" },
    ...customers.map((customer) => ({ value: String(customer.id), label: customer.companyName })),
  ];
}

/** The form itself. Kept separate so ResetAfterSubmit can start it afresh. */
function FollowUpFormBody({
  mode,
  action,
  initialValues,
  customers,
  followUpId,
  returnTo,
  cancelHref,
}: FollowUpFormProps) {
  const [state, formAction] = useActionState(action, initialFollowUpFormState(initialValues));
  const { values, fieldErrors } = state;
  const isCreate = mode === "create";

  return (
    <form action={formAction} noValidate>
      <FormErrorSummary items={summaryItems(state)} />

      {followUpId !== undefined && <input type="hidden" name="followUpId" value={followUpId} />}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      <p className="mb-6 text-sm text-muted">Fields marked * are required.</p>

      <div className="flex flex-col gap-6">
        {isCreate ? (
          <Select
            // The key restarts the drop-down when the saved choice changes
            // (see the note in Select.tsx).
            key={`customer-${values.customerId}`}
            id={ERROR_TARGET_IDS.customerId}
            name="customerId"
            label={FOLLOW_UP_FIELD_LABELS.customerId}
            options={customerOptions(customers)}
            defaultValue={values.customerId}
            required
            error={fieldErrors.customerId}
          />
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">{FOLLOW_UP_FIELD_LABELS.customerId}</p>
            {customers.map((customer) => (
              <p key={customer.id} className="flex items-center gap-2 text-base text-ink">
                <LetterAvatar name={customer.companyName} size="sm" />
                {customer.companyName}
              </p>
            ))}
            <p className="mt-2 text-sm text-muted">
              The customer of a follow-up cannot be changed.
            </p>
          </div>
        )}

        <TextField
          id={ERROR_TARGET_IDS.title}
          name="title"
          label={FOLLOW_UP_FIELD_LABELS.title}
          defaultValue={values.title}
          required
          maxLength={FOLLOW_UP_TITLE_MAX_LENGTH}
          placeholder="e.g. Send the renewal quote"
          error={fieldErrors.title}
        />

        <TextField
          id={ERROR_TARGET_IDS.dueDate}
          name="dueDate"
          type="date"
          label={FOLLOW_UP_FIELD_LABELS.dueDate}
          defaultValue={values.dueDate}
          required
          className="sm:max-w-60"
          error={fieldErrors.dueDate}
        />

        <PillRadioGroup
          key={`priority-${values.priority}`}
          idPrefix={`${ID_PREFIX}-priority`}
          name="priority"
          legend={FOLLOW_UP_FIELD_LABELS.priority}
          options={PRIORITY_PILL_OPTIONS}
          defaultValue={values.priority}
          error={fieldErrors.priority}
          columnsClassName="grid-cols-3"
        />

        {!isCreate && (
          <PillRadioGroup
            key={`status-${values.status}`}
            idPrefix={`${ID_PREFIX}-status`}
            name="status"
            legend={FOLLOW_UP_FIELD_LABELS.status}
            options={STATUS_PILL_OPTIONS}
            defaultValue={values.status}
            error={fieldErrors.status}
            columnsClassName="grid-cols-2 sm:max-w-80"
          />
        )}

        <TextArea
          id={ERROR_TARGET_IDS.notes}
          name="notes"
          label={FOLLOW_UP_FIELD_LABELS.notes}
          defaultValue={values.notes}
          maxLength={FOLLOW_UP_NOTES_MAX_LENGTH}
          rows={4}
          hint="Optional. The first line is shown in lists."
          error={fieldErrors.notes}
        />
      </div>

      <FormActions submitLabel={isCreate ? "Create follow-up" : "Save changes"} cancelHref={cancelHref} />
    </form>
  );
}

export default function FollowUpForm(props: FollowUpFormProps) {
  return (
    <ResetAfterSubmit>
      <FollowUpFormBody {...props} />
    </ResetAfterSubmit>
  );
}
