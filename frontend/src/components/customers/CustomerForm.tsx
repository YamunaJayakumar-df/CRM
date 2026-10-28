// CustomerForm: the Add / Edit customer form (one component for both).
//
// How saving works:
// - useActionState(action, initialState) gives back:
//     state      -> what the last save returned (typed values + errors)
//     formAction -> what we put on <form action>; calling it runs the
//                   Server Action (createCustomer / updateCustomer) on the server
// - On success the action redirects, so this form simply goes away.
// - On failure the action returns the typed values + errors. The fields use
//   those values as their starting text, so nothing the user typed is lost.
//   (React empties a form after each submit and refills it from defaultValue.)
//
// noValidate: the browser's own pop-up checks are turned off so every
// problem is shown the same way, by the backend's messages next to the fields.
// `required` stays on Company name, so screen readers still announce it.
//
// ResetAfterSubmit (components/forms) wraps the form so that, after a save,
// pressing browser Back shows an empty form instead of the old typing.
"use client";

import { useActionState } from "react";
import FormActions from "@/components/forms/FormActions";
import ResetAfterSubmit from "@/components/forms/ResetAfterSubmit";
import FormErrorSummary, { type FormErrorItem } from "@/components/forms/FormErrorSummary";
import Select from "@/components/forms/Select";
import TextArea from "@/components/forms/TextArea";
import TextField from "@/components/forms/TextField";
import {
  CUSTOMER_FIELD_LABELS,
  CUSTOMER_FORM_FIELDS,
  CUSTOMER_MAX_LENGTHS,
  initialCustomerFormState,
  type CustomerFormField,
  type CustomerFormState,
  type CustomerFormValues,
} from "@/lib/customers/customerForm";
import { CUSTOMER_STATUS_LABELS } from "@/lib/format/labels";

type CustomerFormProps = {
  mode: "create" | "edit";
  /** The Server Action that saves the form. */
  action: (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>;
  initialValues: CustomerFormValues;
  /** Edit only: which customer is being changed. */
  customerId?: number;
  /** Edit only: a safe internal path to go to after saving. */
  returnTo?: string | null;
  /** Where Cancel goes. */
  cancelHref: string;
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: CUSTOMER_STATUS_LABELS.ACTIVE },
  { value: "INACTIVE", label: CUSTOMER_STATUS_LABELS.INACTIVE },
];

/** The id of a field's input, e.g. "customer-email". Used by labels and error links. */
function fieldId(field: CustomerFormField): string {
  return `customer-${field}`;
}

/** Errors for the summary box: general ones first, then one per field (in form order). */
function summaryItems(state: CustomerFormState): FormErrorItem[] {
  const items: FormErrorItem[] = state.formErrors.map((message) => ({ message }));
  for (const field of CUSTOMER_FORM_FIELDS) {
    const message = state.fieldErrors[field];
    if (message !== undefined) {
      items.push({ message, href: `#${fieldId(field)}` });
    }
  }
  return items;
}

/** The form itself. Kept separate so ResetAfterSubmit can start it afresh. */
function CustomerFormBody({
  mode,
  action,
  initialValues,
  customerId,
  returnTo,
  cancelHref,
}: CustomerFormProps) {
  const [state, formAction] = useActionState(action, initialCustomerFormState(initialValues));
  const { values, fieldErrors } = state;

  return (
    <form action={formAction} noValidate>
      <FormErrorSummary items={summaryItems(state)} />

      {customerId !== undefined && <input type="hidden" name="customerId" value={customerId} />}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      <p className="mb-6 text-sm text-muted">Fields marked * are required.</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TextField
          id={fieldId("companyName")}
          name="companyName"
          label={CUSTOMER_FIELD_LABELS.companyName}
          defaultValue={values.companyName}
          required
          maxLength={CUSTOMER_MAX_LENGTHS.companyName}
          autoComplete="organization"
          error={fieldErrors.companyName}
        />
        <TextField
          id={fieldId("contactName")}
          name="contactName"
          label={CUSTOMER_FIELD_LABELS.contactName}
          defaultValue={values.contactName}
          maxLength={CUSTOMER_MAX_LENGTHS.contactName}
          autoComplete="name"
          error={fieldErrors.contactName}
        />
        <TextField
          id={fieldId("email")}
          name="email"
          type="email"
          label={CUSTOMER_FIELD_LABELS.email}
          defaultValue={values.email}
          maxLength={CUSTOMER_MAX_LENGTHS.email}
          autoComplete="email"
          error={fieldErrors.email}
        />
        <TextField
          id={fieldId("phone")}
          name="phone"
          type="tel"
          label={CUSTOMER_FIELD_LABELS.phone}
          defaultValue={values.phone}
          maxLength={CUSTOMER_MAX_LENGTHS.phone}
          autoComplete="tel"
          error={fieldErrors.phone}
        />
        <TextField
          id={fieldId("website")}
          name="website"
          label={CUSTOMER_FIELD_LABELS.website}
          defaultValue={values.website}
          maxLength={CUSTOMER_MAX_LENGTHS.website}
          autoComplete="url"
          hint="e.g. acme.com"
          error={fieldErrors.website}
        />
        <TextField
          id={fieldId("industry")}
          name="industry"
          label={CUSTOMER_FIELD_LABELS.industry}
          defaultValue={values.industry}
          maxLength={CUSTOMER_MAX_LENGTHS.industry}
          error={fieldErrors.industry}
        />
        {mode === "edit" && (
          <Select
            // The key restarts the drop-down when the saved choice changes
            // (see the note in Select.tsx).
            key={values.status}
            id={fieldId("status")}
            name="status"
            label={CUSTOMER_FIELD_LABELS.status}
            options={STATUS_OPTIONS}
            defaultValue={values.status}
            error={fieldErrors.status}
          />
        )}
        <TextArea
          id={fieldId("notes")}
          name="notes"
          label={CUSTOMER_FIELD_LABELS.notes}
          defaultValue={values.notes}
          maxLength={CUSTOMER_MAX_LENGTHS.notes}
          rows={6}
          error={fieldErrors.notes}
          className="md:col-span-2"
        />
      </div>

      <FormActions
        submitLabel={mode === "create" ? "Add customer" : "Save changes"}
        cancelHref={cancelHref}
      />
    </form>
  );
}

export default function CustomerForm(props: CustomerFormProps) {
  return (
    <ResetAfterSubmit>
      <CustomerFormBody {...props} />
    </ResetAfterSubmit>
  );
}
