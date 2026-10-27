// Shown when someone opens /customers/<id>/edit for a customer that does not
// exist (wrong link, or the customer was removed). Next.js uses this file
// whenever the edit page calls notFound().
import Link from "next/link";
import { Building2 } from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";

export default function EditCustomerNotFound() {
  return (
    <Card>
      <EmptyState
        icon={<Building2 size={28} strokeWidth={1.5} aria-hidden="true" />}
        message="Customer not found"
        hint="The link may be wrong, or the customer was removed."
        action={
          <Link
            href="/customers"
            className="inline-flex h-11 items-center rounded-xl border border-line px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover"
          >
            Back to customers
          </Link>
        }
      />
    </Card>
  );
}
