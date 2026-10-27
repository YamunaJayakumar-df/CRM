// Add customer (/customers/new): an empty customer form.
//
// This page needs no data and reads nothing from the URL, so Next.js can
// build it ahead of time and send it instantly. Saving runs the
// createCustomer Server Action (app/customers/actions.ts), which opens the
// new customer in the dashboard's side panel.
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import CustomerForm from "@/components/customers/CustomerForm";
import { EMPTY_CUSTOMER_FORM_VALUES } from "@/lib/customers/customerForm";
import { createCustomer } from "../actions";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="Add customer" subtitle="A company you work with. You can change these details later." />
      <div className="max-w-2xl">
        <Card>
          <CustomerForm
            mode="create"
            action={createCustomer}
            initialValues={EMPTY_CUSTOMER_FORM_VALUES}
            cancelHref="/customers"
          />
        </Card>
      </div>
    </>
  );
}
