// InteractionForm: the Log / Edit interaction form (one component for both).
//
// Works exactly like CustomerForm (read its notes):
// - useActionState runs the Server Action (createInteraction /
//   updateInteraction) and gives back the typed values + errors when saving
//   fails; on success the action redirects away.
// - noValidate: every problem is shown the same way, next to its field.
// - ResetAfterSubmit: after a save, browser Back shows a fresh form.
//
// Fields:
// - Customer: a drop-down when logging; read-only text when editing (the
//   backend does not allow moving an interaction to another customer).
// - Type: four radio pills. Summary: multi-line text.
// - Date + Time: optional; both empty = "now" when logging, "unchanged"
//   when editing.
"use client";

import { useActionState } from "react";
import LetterAvatar from "@/components/LetterAvatar";
import FormActions from "@/components/forms/FormActions";
import FormErrorSummary, { type FormErrorItem } from "@/components/forms/FormErrorSummary";
import ResetAfterSubmit from "@/components/forms/ResetAfterSubmit";
import Select, { type SelectOption } from "@/components/forms/Select";
import TextArea from "@/components/forms/TextArea";
import {
  INTERACTION_ERROR_FIELDS,
  INTERACTION_FIELD_LABELS,
  INTERACTION_SUMMARY_MAX_LENGTH,
  initialInteractionFormState,
  type InteractionErrorField,
  type InteractionFormState,
  type InteractionFormValues,
} from "@/lib/interactions/interactionForm";
import DateTimeFields from "./DateTimeFields";
import InteractionTypeRadioGroup, { typeRadioId } from "./InteractionTypeRadioGroup";

/** The few customer details the form needs. */
export type InteractionFormCustomer = {
  id: number;
  companyName: string;
};

type InteractionFormProps = {
  mode: "create" | "edit";
  /** The Server Action that saves the form. */
  action: (state: InteractionFormState, formData: FormData) => Promise<InteractionFormState>;
  initialValues: InteractionFormValues;
  /** Create: every customer for the drop-down (A to Z). Edit: just the one. */
  customers: InteractionFormCustomer[];
  /** Edit only: which interaction is being changed. */
  interactionId?: number;
  /** A safe internal path to go to after saving. */
  returnTo?: string | null;
  /** Where Cancel goes. */
  cancelHref: string;
};

const ID_PREFIX = "interaction";

/** Where each error's link in the summary jumps to. */
const ERROR_TARGET_IDS: Record<InteractionErrorField, string> = {
  customerId: `${ID_PREFIX}-customerId`,
  type: typeRadioId(`${ID_PREFIX}-type`, "CALL"),
  summary: `${ID_PREFIX}-summary`,
  occurredAt: `${ID_PREFIX}-occurredAt-date`,
};

/** Errors for the summary box: general ones first, then one per field (in form order). */
function summaryItems(state: InteractionFormState): FormErrorItem[] {
  const items: FormErrorItem[] = state.formErrors.map((message) => ({ message }));
  for (const field of INTERACTION_ERROR_FIELDS) {
    const message = state.fieldErrors[field];
    if (message !== undefined) {
      items.push({ message, href: `#${ERROR_TARGET_IDS[field]}` });
    }
  }
  return items;
}

/** Drop-down options: a "choose" prompt first, then every customer. */
function customerOptions(customers: InteractionFormCustomer[]): SelectOption[] {
  return [
    { value: "", label: "Choose a customer" },
    ...customers.map((customer) => ({ value: String(customer.id), label: customer.companyName })),
  ];
}

/** The form itself. Kept separate so ResetAfterSubmit can start it afresh. */
function InteractionFormBody({
  mode,
  action,
  initialValues,
  customers,
  interactionId,
  returnTo,
  cancelHref,
}: InteractionFormProps) {
  const [state, formAction] = useActionState(action, initialInteractionFormState(initialValues));
  const { values, fieldErrors } = state;
  const isCreate = mode === "create";

  return (
    <form action={formAction} noValidate>
      <FormErrorSummary items={summaryItems(state)} />

      {interactionId !== undefined && (
        <input type="hidden" name="interactionId" value={interactionId} />
      )}
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
            label={INTERACTION_FIELD_LABELS.customerId}
            options={customerOptions(customers)}
            defaultValue={values.customerId}
            required
            error={fieldErrors.customerId}
          />
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">{INTERACTION_FIELD_LABELS.customerId}</p>
            {customers.map((customer) => (
              <p key={customer.id} className="flex items-center gap-2 text-base text-ink">
                <LetterAvatar name={customer.companyName} size="sm" />
                {customer.companyName}
              </p>
            ))}
            <p className="mt-2 text-sm text-muted">
              The customer of a logged interaction cannot be changed.
            </p>
          </div>
        )}

        <InteractionTypeRadioGroup
          key={`type-${values.type}`}
          idPrefix={`${ID_PREFIX}-type`}
          name="type"
          legend={INTERACTION_FIELD_LABELS.type}
          defaultValue={values.type}
          error={fieldErrors.type}
        />

        <TextArea
          id={ERROR_TARGET_IDS.summary}
          name="summary"
          label={INTERACTION_FIELD_LABELS.summary}
          defaultValue={values.summary}
          required
          maxLength={INTERACTION_SUMMARY_MAX_LENGTH}
          rows={6}
          hint="First line is used as the title"
          error={fieldErrors.summary}
        />

        <DateTimeFields
          idPrefix={`${ID_PREFIX}-occurredAt`}
          legend={INTERACTION_FIELD_LABELS.occurredAt}
          defaultDate={values.date}
          defaultTime={values.time}
          hint={
            isCreate
              ? "Leave empty to use now (India time)"
              : "India time. Leave both empty to keep the saved date and time."
          }
          error={fieldErrors.occurredAt}
        />
      </div>

      <FormActions submitLabel={isCreate ? "Log interaction" : "Save changes"} cancelHref={cancelHref} />
    </form>
  );
}

export default function InteractionForm(props: InteractionFormProps) {
  return (
    <ResetAfterSubmit>
      <InteractionFormBody {...props} />
    </ResetAfterSubmit>
  );
}
