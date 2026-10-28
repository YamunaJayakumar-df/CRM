// Everything the Add / Edit customer form needs that is plain data and logic
// (no React, no server code), so it can be unit-tested and shared by the
// form (browser) and the Server Actions (server).
//
// - the list of fields, their labels and length limits (same as the backend)
// - reading the submitted FormData safely (only known fields, trimmed)
// - building the JSON body for POST /customers and PATCH /customers/:id
// - the shape of the form's state (typed values + errors)
import type { Customer, CustomerStatus } from "@/lib/api/types";

/** Every field of the customer form, in the order they are shown. */
export const CUSTOMER_FORM_FIELDS = [
  "companyName",
  "contactName",
  "email",
  "phone",
  "website",
  "industry",
  "status",
  "notes",
] as const;

export type CustomerFormField = (typeof CUSTOMER_FORM_FIELDS)[number];

/** What the user typed (or chose) in each field. Always text, never null. */
export type CustomerFormValues = Record<CustomerFormField, string>;

/** Friendly field names, used as input labels and in error messages. */
export const CUSTOMER_FIELD_LABELS: Record<CustomerFormField, string> = {
  companyName: "Company name",
  contactName: "Contact name",
  email: "Email",
  phone: "Phone",
  website: "Website",
  industry: "Industry",
  status: "Status",
  notes: "Notes",
};

/**
 * Longest allowed text per field. MUST match MAX_LENGTHS in
 * backend/src/customers/customerValidation.ts (the backend has the final say;
 * these only stop people typing more than will be accepted).
 */
export const CUSTOMER_MAX_LENGTHS: Record<Exclude<CustomerFormField, "status">, number> = {
  companyName: 200,
  contactName: 200,
  email: 254,
  phone: 50,
  website: 200,
  industry: 100,
  notes: 5000,
};

/** The values of a brand-new, empty form. New customers start as Active. */
export const EMPTY_CUSTOMER_FORM_VALUES: CustomerFormValues = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  website: "",
  industry: "",
  status: "ACTIVE",
  notes: "",
};

/** The form's state, kept by useActionState between submits. */
export type CustomerFormState = {
  /** What is in the form, so a failed save keeps the user's typing. */
  values: CustomerFormValues;
  /** One message per field that has a problem. */
  fieldErrors: Partial<Record<CustomerFormField, string>>;
  /** Messages that belong to no single field (shown at the top). */
  formErrors: string[];
};

/** The state a form starts with: the given values and no errors. */
export function initialCustomerFormState(values: CustomerFormValues): CustomerFormState {
  return { values, fieldErrors: {}, formErrors: [] };
}

/** Fill the form from a saved customer; missing (null) values become "". */
export function customerToFormValues(customer: Customer): CustomerFormValues {
  return {
    companyName: customer.companyName,
    contactName: customer.contactName ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    website: customer.website ?? "",
    industry: customer.industry ?? "",
    status: customer.status,
    notes: customer.notes ?? "",
  };
}

/**
 * Read ONLY the known customer fields from a submitted form, trimmed.
 * Why not just take everything: a form post can contain any extra fields
 * someone adds by hand; we never pass unknown fields on to the backend.
 * A missing field or a file upload in its place becomes "".
 */
export function readCustomerFormValues(formData: FormData): CustomerFormValues {
  const values = { ...EMPTY_CUSTOMER_FORM_VALUES };
  for (const field of CUSTOMER_FORM_FIELDS) {
    const raw = formData.get(field);
    values[field] = typeof raw === "string" ? raw.trim() : "";
  }
  return values;
}

/** JSON body for POST /customers. */
export type CreateCustomerBody = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  notes: string;
};

/** JSON body for PATCH /customers/:id: every field, so clearing one works. */
export type UpdateCustomerBody = CreateCustomerBody & {
  status: CustomerStatus;
};

/**
 * Body for creating a customer. Empty optional fields are sent as "" (the
 * backend stores them as "no value"). No status: the backend makes new
 * customers Active.
 */
export function createCustomerBody(values: CustomerFormValues): CreateCustomerBody {
  return {
    companyName: values.companyName,
    contactName: values.contactName,
    email: values.email,
    phone: values.phone,
    website: values.website,
    industry: values.industry,
    notes: values.notes,
  };
}

/**
 * Body for updating a customer. ALL fields are sent: a field the user
 * emptied is sent as "" and so is cleared. The status text is passed on
 * as typed; the backend rejects anything but ACTIVE / INACTIVE.
 */
export function updateCustomerBody(values: CustomerFormValues): UpdateCustomerBody {
  return {
    ...createCustomerBody(values),
    status: values.status as CustomerStatus,
  };
}
