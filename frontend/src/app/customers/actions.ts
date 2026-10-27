// Server Actions for the Add / Edit customer forms.
//
// What a Server Action is: a function that runs ON THE SERVER but can be
// called by a <form> in the browser. The "use server" line at the top makes
// every exported function here such an action. The browser only gets a
// secret reference to it; the code, the backend address and the backend
// call all stay on the server.
//
// Each action is used with React's useActionState, so it receives the
// form's previous state first and the submitted FormData second, and
// returns the new state (typed values + errors) when saving fails.
//
// Safety: anyone could post to an action directly, so nothing here trusts
// the form. We read only the known fields, the backend validates them again,
// the customer id is checked, and returnTo must be a safe internal path.
// (Sign-in checks will be added here once the CRM has logins.)
//
// On success we:
//   1. revalidatePath("/", "layout"): forget every page the browser has
//      kept, so the dashboard, panel and list all show the new data
//   2. redirect(...): go to the next page. redirect() works by throwing a
//      special signal, so it is called last and never inside try/catch.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { backendSend } from "@/lib/api/backendSend";
import type { Customer } from "@/lib/api/types";
import {
  CUSTOMER_FIELD_LABELS,
  createCustomerBody,
  readCustomerFormValues,
  updateCustomerBody,
  type CustomerFormState,
  type CustomerFormValues,
} from "@/lib/customers/customerForm";
import { readCustomerId } from "@/lib/dashboard/customerPanelView";
import { splitFieldErrors } from "@/lib/forms/fieldErrors";
import { safeReturnPath } from "@/lib/forms/safeReturnPath";

const CUSTOMER_GONE_MESSAGE = "This customer no longer exists";

/** The form state for a save the backend refused: keep the typing, show the errors. */
function failedState(
  values: CustomerFormValues,
  error: string,
  details: string[],
): CustomerFormState {
  const { fieldErrors, formErrors } = splitFieldErrors(details, CUSTOMER_FIELD_LABELS);
  const hasAnyMessage = Object.keys(fieldErrors).length > 0 || formErrors.length > 0;
  // A 400 always has details; other errors (404, 409) only have `error`.
  return { values, fieldErrors, formErrors: hasAnyMessage ? formErrors : [error] };
}

/** Create a customer, then open them in the side panel on the Customers page. */
export async function createCustomer(
  _previousState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const values = readCustomerFormValues(formData);
  const result = await backendSend<Customer>("POST", "/customers", createCustomerBody(values));

  if (!result.ok) {
    return failedState(values, result.error, result.details);
  }
  if (result.data === null) {
    throw new Error("Backend sent no customer after POST /customers");
  }

  revalidatePath("/", "layout");
  redirect(`/customers?customer=${result.data.id}`);
}

/** Save changes to a customer, then go back where the user came from. */
export async function updateCustomer(
  _previousState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const values = readCustomerFormValues(formData);

  // The id travels in a hidden field, so it is checked like any other input.
  const rawId = formData.get("customerId");
  const customerId = readCustomerId(typeof rawId === "string" ? rawId : undefined);
  if (customerId === null) {
    return { values, fieldErrors: {}, formErrors: [CUSTOMER_GONE_MESSAGE] };
  }

  const result = await backendSend<Customer>(
    "PATCH",
    `/customers/${customerId}`,
    updateCustomerBody(values),
  );

  if (!result.ok) {
    if (result.status === 404) {
      return { values, fieldErrors: {}, formErrors: [CUSTOMER_GONE_MESSAGE] };
    }
    return failedState(values, result.error, result.details);
  }

  const returnTo = safeReturnPath(formData.get("returnTo"));
  revalidatePath("/", "layout");
  redirect(returnTo ?? `/customers?customer=${customerId}`);
}
