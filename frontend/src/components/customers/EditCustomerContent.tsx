// EditCustomerContent: loads one customer and shows the Edit form.
//
// Async Server Component, rendered inside <Suspense> by the edit page.
// - The id is checked BEFORE calling the backend ("abc", "0" -> not found).
// - ?returnTo is only used if it is a safe path inside this app
//   (lib/forms/safeReturnPath). Cancel goes there, or to the customer list.
// - Backend failures other than "not found" go to app/error.tsx.
import { notFound } from "next/navigation";
import { updateCustomer } from "@/app/customers/actions";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import { getCustomer } from "@/lib/api/queries";
import { customerToFormValues } from "@/lib/customers/customerForm";
import { readCustomerId } from "@/lib/customers/customerPageView";
import { firstValue, type SearchParamValue } from "@/lib/dashboard/followUpView";
import { safeReturnPath } from "@/lib/forms/safeReturnPath";
import CustomerForm from "./CustomerForm";

type EditCustomerContentProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function EditCustomerContent({
  params,
  searchParams,
}: EditCustomerContentProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  const customerId = readCustomerId(id);
  if (customerId === null) {
    notFound();
  }
  const customer = await getCustomer(customerId);
  if (customer === null) {
    notFound();
  }

  const returnTo = safeReturnPath(firstValue(query.returnTo));

  return (
    <>
      <PageHeader title={`Edit ${customer.companyName}`} subtitle="Change the details and save." />
      <div className="max-w-2xl">
        <Card>
          <CustomerForm
            mode="edit"
            action={updateCustomer}
            initialValues={customerToFormValues(customer)}
            customerId={customer.id}
            returnTo={returnTo}
            cancelHref={returnTo ?? "/customers"}
          />
        </Card>
      </div>
    </>
  );
}
