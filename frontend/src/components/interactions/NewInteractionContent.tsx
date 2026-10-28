// NewInteractionContent: loads every customer and shows the Log form.
//
// Async Server Component, rendered inside <Suspense> by the new page.
// The URL can preselect things; anything invalid is simply ignored:
//   ?customerId=12 -> only if a customer with that id exists
//   ?type=MEETING  -> only one of CALL / EMAIL / MEETING / NOTE
//   ?returnTo=/... -> only a safe path inside this app (safeReturnPath)
// With no customers at all there is nothing to log against, so we show a
// friendly empty state with a link to add the first customer.
import { Building2 } from "lucide-react";
import { createInteraction } from "@/app/interactions/actions";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import PrimaryButtonLink from "@/components/PrimaryButtonLink";
import { listCustomers } from "@/lib/api/queries";
import { NEW_CUSTOMER_HREF } from "@/lib/customers/customerHrefs";
import { readCustomerId } from "@/lib/customers/customerPageView";
import { firstValue, type SearchParamValue } from "@/lib/dashboard/followUpView";
import { safeReturnPath } from "@/lib/forms/safeReturnPath";
import {
  EMPTY_INTERACTION_FORM_VALUES,
  readInteractionType,
} from "@/lib/interactions/interactionForm";
import InteractionForm from "./InteractionForm";

type NewInteractionContentProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function NewInteractionContent({ searchParams }: NewInteractionContentProps) {
  const [query, customers] = await Promise.all([searchParams, listCustomers()]);

  if (customers.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 size={28} strokeWidth={1.5} aria-hidden="true" />}
          message="Add a customer first"
          hint="Every interaction belongs to a customer."
          action={<PrimaryButtonLink href={NEW_CUSTOMER_HREF}>Add customer</PrimaryButtonLink>}
        />
      </Card>
    );
  }

  const wantedCustomerId = readCustomerId(query.customerId);
  const customerExists = customers.some((customer) => customer.id === wantedCustomerId);
  const type = readInteractionType(firstValue(query.type));
  const returnTo = safeReturnPath(firstValue(query.returnTo));

  return (
    <Card>
      <InteractionForm
        mode="create"
        action={createInteraction}
        initialValues={{
          ...EMPTY_INTERACTION_FORM_VALUES,
          customerId: customerExists ? String(wantedCustomerId) : "",
          type: type ?? "",
        }}
        customers={customers.map(({ id, companyName }) => ({ id, companyName }))}
        returnTo={returnTo}
        cancelHref={returnTo ?? "/interactions"}
      />
    </Card>
  );
}
