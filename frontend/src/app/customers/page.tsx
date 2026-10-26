// Customers (/customers): the list of customer companies.
// Placeholder for now; the real list is loaded in a later step.
import { Users } from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="The companies you work with."
      />
      <Card>
        <EmptyState
          icon={<Users size={28} strokeWidth={1.5} aria-hidden="true" />}
          message="Customers will appear here"
          hint="Once customers are added, you can find and open them from this list."
        />
      </Card>
    </>
  );
}
