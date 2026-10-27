// CustomerResults: loads the customers and shows the table (or an empty state).
//
// Async Server Component, rendered inside <Suspense> by CustomersBody.
// - No customers at all -> "No customers yet" with an "Add your first
//   customer" link.
// - A search with no results -> "No customers match".
// - The backend returns at most 500 customers; if the list is full, a note
//   says so (paging comes later).
// If the backend fails, the error goes to app/error.tsx ("Try again").
import Link from "next/link";
import { SearchX, Users } from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { listCustomers } from "@/lib/api/queries";
import {
  customersListHref,
  customersPanelPlace,
  NEW_CUSTOMER_HREF,
} from "@/lib/customers/customerHrefs";
import CustomerTable from "./CustomerTable";

/** The most customers the backend sends in one list (MAX_CUSTOMERS_PER_LIST). */
const BACKEND_LIST_LIMIT = 500;

type CustomerResultsProps = {
  search: string;
};

const emptyIconProps = { size: 28, strokeWidth: 1.5, "aria-hidden": true } as const;

export default async function CustomerResults({ search }: CustomerResultsProps) {
  const customers = await listCustomers(search === "" ? undefined : search);

  if (customers.length === 0 && search === "") {
    return (
      <Card>
        <EmptyState
          icon={<Users {...emptyIconProps} />}
          message="No customers yet"
          hint="Add the companies you work with to start tracking calls and follow-ups."
          action={
            <Link
              href={NEW_CUSTOMER_HREF}
              className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-base font-medium text-on-primary transition-colors duration-150 hover:bg-primary-hover"
            >
              Add your first customer
            </Link>
          }
        />
      </Card>
    );
  }

  if (customers.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<SearchX {...emptyIconProps} />}
          message="No customers match"
          hint={`Nothing found for “${search}”. Try a company, contact, email or website.`}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CustomerTable
        customers={customers}
        panelPlace={customersPanelPlace(search)}
        returnTo={customersListHref(search)}
      />
      {customers.length >= BACKEND_LIST_LIMIT && (
        <p className="mt-4 text-xs text-muted">
          Showing the first {BACKEND_LIST_LIMIT}. Search to narrow the list.
        </p>
      )}
    </Card>
  );
}
