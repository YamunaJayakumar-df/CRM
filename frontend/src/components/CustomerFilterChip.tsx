// CustomerFilterChip: "Customer: Acme Corp ×", shown above a list page
// (Interactions, Follow-ups) when the URL has ?customerId=12 (the customer
// panel's "View all" link adds it).
// The × link (`removeHref`) removes only the customer filter and keeps the
// rest; each page builds that link with its own URL helper.
//
// Async Server Component (inside <Suspense>): it asks the backend for the
// company name. If no customer has that id, the chip says "Customer #12"
// so the user can still see and remove the filter.
import Link from "next/link";
import { X } from "lucide-react";
import { getCustomer } from "@/lib/api/queries";

type CustomerFilterChipProps = {
  customerId: number;
  /** The same page without the customer filter. */
  removeHref: string;
};

export default async function CustomerFilterChip({ customerId, removeHref }: CustomerFilterChipProps) {
  const customer = await getCustomer(customerId);
  const name = customer?.companyName ?? `#${customerId}`;

  return (
    <span className="inline-flex h-11 max-w-full items-center rounded-full border border-line bg-card pl-4 text-sm text-ink">
      <span className="truncate">
        <span className="text-muted">Customer:</span> {name}
      </span>
      <Link
        href={removeHref}
        scroll={false}
        aria-label={`Remove customer filter (${name})`}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 -outline-offset-2 hover:bg-hover hover:text-ink"
      >
        <X size={16} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </span>
  );
}
