// Follow-ups (/follow-ups): tasks to get back to a customer by a date.
// Placeholder for now; the real list is loaded in a later step.
import { CalendarCheck } from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";

export default function FollowUpsPage() {
  return (
    <>
      <PageHeader
        title="Follow-ups"
        subtitle="Things to get back to customers about, and when."
      />
      <Card>
        <EmptyState
          icon={
            <CalendarCheck size={28} strokeWidth={1.5} aria-hidden="true" />
          }
          message="Follow-ups will appear here"
          hint="Open and overdue follow-ups will be listed here."
        />
      </Card>
    </>
  );
}
