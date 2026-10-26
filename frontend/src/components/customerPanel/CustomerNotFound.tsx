// CustomerNotFound: what the customer panel shows when ?customer= is not a
// valid id, or no customer has that id (e.g. it was deleted).
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

type CustomerNotFoundProps = {
  /** The dashboard link without ?customer (keeps the follow-up filter). */
  backHref: string;
};

export default function CustomerNotFound({ backHref }: CustomerNotFoundProps) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Building2 className="text-icon" size={28} strokeWidth={1.5} aria-hidden="true" />
      <h2 className="mt-3 text-lg font-medium text-ink">Customer not found</h2>
      <p className="mt-1 text-sm text-muted">The link may be wrong, or the customer was removed.</p>
      <Link
        href={backHref}
        scroll={false}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover"
      >
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        Back
      </Link>
    </div>
  );
}
