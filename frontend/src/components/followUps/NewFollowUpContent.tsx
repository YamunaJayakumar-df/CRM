// NewFollowUpContent: loads every customer and shows the New follow-up form.
//
// Async Server Component, rendered inside <Suspense> by the new page.
// The URL can preselect things; anything invalid is simply ignored:
//   ?customerId=12 -> only if a customer with that id exists
//   ?returnTo=/... -> only a safe path inside this app (safeReturnPath)
// The Due date starts as today in India (most follow-ups are planned for
// soon, and it is easy to change).
// With no customers at all there is nothing to plan for, so we show a
// friendly empty state with a link to add the first customer.
import { Building2 } from "lucide-react";
import { createFollowUp } from "@/app/follow-ups/actions";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import PrimaryButtonLink from "@/components/PrimaryButtonLink";
import { listCustomers } from "@/lib/api/queries";
import { NEW_CUSTOMER_HREF } from "@/lib/customers/customerHrefs";
import { readCustomerId } from "@/lib/customers/customerPageView";
import { firstValue, type SearchParamValue } from "@/lib/dashboard/followUpView";
import { EMPTY_FOLLOW_UP_FORM_VALUES } from "@/lib/followUps/followUpForm";
import { todayInKolkata } from "@/lib/format/dates";
import { safeReturnPath } from "@/lib/forms/safeReturnPath";
import FollowUpForm from "./FollowUpForm";

type NewFollowUpContentProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function NewFollowUpContent({ searchParams }: NewFollowUpContentProps) {
  const [query, customers] = await Promise.all([searchParams, listCustomers()]);

  if (customers.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 size={28} strokeWidth={1.5} aria-hidden="true" />}
          message="Add a customer first"
          hint="Every follow-up belongs to a customer."
          action={<PrimaryButtonLink href={NEW_CUSTOMER_HREF}>Add customer</PrimaryButtonLink>}
        />
      </Card>
    );
  }

  const wantedCustomerId = readCustomerId(query.customerId);
  const customerExists = customers.some((customer) => customer.id === wantedCustomerId);
  const returnTo = safeReturnPath(firstValue(query.returnTo));
  // Read after the awaits above, so it is the real "today" of this request.
  const today = todayInKolkata(new Date());

  return (
    <Card>
      <FollowUpForm
        mode="create"
        action={createFollowUp}
        initialValues={{
          ...EMPTY_FOLLOW_UP_FORM_VALUES,
          customerId: customerExists ? String(wantedCustomerId) : "",
          dueDate: today,
        }}
        customers={customers.map(({ id, companyName }) => ({ id, companyName }))}
        returnTo={returnTo}
        cancelHref={returnTo ?? "/follow-ups"}
      />
    </Card>
  );
}
