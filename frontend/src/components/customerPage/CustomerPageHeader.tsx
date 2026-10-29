// CustomerPageHeader: the top of a customer's page: "← Customers", the
// company's initials, name, status and industry, and the Edit / Log /
// + Follow-up buttons (they come back to this page and tab after saving).
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CustomerStatusBadge from "@/components/CustomerStatusBadge";
import LetterAvatar from "@/components/LetterAvatar";
import CustomerQuickActions from "@/components/customerPage/CustomerQuickActions";
import type { Customer } from "@/lib/api/types";

type CustomerPageHeaderProps = {
  customer: Customer;
  /** This page and tab, for the forms to come back to. */
  returnTo: string;
};

export default function CustomerPageHeader({ customer, returnTo }: CustomerPageHeaderProps) {
  const industry = (customer.industry ?? "").trim();

  return (
    <div className="mb-6">
      <Link
        href="/customers"
        className="-ml-3 inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted transition-colors duration-150 hover:bg-hover hover:text-ink"
      >
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        Customers
      </Link>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <LetterAvatar name={customer.companyName} />
          <div className="min-w-0">
            <h1 className="text-title font-semibold break-words text-ink">{customer.companyName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <CustomerStatusBadge status={customer.status} />
              {industry !== "" && <span className="text-sm text-muted">{industry}</span>}
            </div>
          </div>
        </div>
        <CustomerQuickActions customerId={customer.id} returnTo={returnTo} />
      </div>
    </div>
  );
}
