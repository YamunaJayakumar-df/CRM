// CustomerIdentity: the big round building icon, the company name, the
// Active/Inactive pill and the website under it.
//
// The website is only a clickable link when toSafeWebsiteUrl says it is a
// real http/https address; anything else is shown as plain text, so odd
// text in the field can never run code. It opens in a new tab, and
// rel="noopener noreferrer" stops that site from controlling our tab.
import { Building2 } from "lucide-react";
import CustomerStatusBadge from "@/components/CustomerStatusBadge";
import type { Customer } from "@/lib/api/types";
import { displayWebsite, toSafeWebsiteUrl } from "@/lib/format/safeWebsiteUrl";

type CustomerIdentityProps = {
  customer: Customer;
};

export default function CustomerIdentity({ customer }: CustomerIdentityProps) {
  const websiteText = displayWebsite(customer.website);
  const websiteUrl = toSafeWebsiteUrl(customer.website);

  return (
    <div className="mt-6 flex items-center gap-4">
      <span
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
        aria-hidden="true"
      >
        <Building2 size={28} strokeWidth={1.75} />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-title font-medium break-words text-ink">{customer.companyName}</h2>
          <CustomerStatusBadge status={customer.status} />
        </div>

        {websiteUrl !== null && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block max-w-full truncate text-sm text-accent hover:underline"
          >
            {websiteText}
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
        {websiteUrl === null && websiteText !== "" && (
          <p className="mt-1 truncate text-sm text-muted">{websiteText}</p>
        )}
      </div>
    </div>
  );
}
